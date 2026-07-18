-- ═══════════════════════════════════════════════════════════════════════════
-- Chantier interconnexion — Vague 3 : automatisation EVM (calcul unifié +
-- génération d'instantanés persistés)
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat de l'audit : la formule PV/EV/AC existait déjà, mais dupliquée côté
-- client (useEvm.ts) ET côté dashboard-summary, et n'écrivait JAMAIS dans
-- evm_snapshots (lecture seule depuis 20260715400000_evm_reports_readonly_rls,
-- qui documentait explicitement ce manque comme "chantier séparé"). Cette
-- migration fournit la fonction de calcul unique (appelée par le frontend via
-- RPC ET par la génération d'instantanés ci-dessous) et la fonction de
-- génération elle-même. La planification automatique (pg_cron) est dans une
-- migration séparée pour ne pas faire échouer celle-ci si l'extension n'est
-- pas disponible sur ce projet Supabase.

-- ── Calcul EVM d'un projet à un instant donné ─────────────────────────────
-- Réplique fidèlement la formule déjà en place dans useEvm.ts
-- (useProjectEvmSummary) : AC = somme des budget_lignes.montant_paye du
-- projet (toutes versions confondues, comportement existant non modifié) ;
-- EV = somme des activités PTBA (montant_prevu × taux_realisation / 100) ;
-- PV = interpolation linéaire du montant_prevu de chaque activité entre ses
-- dates prévues de début/fin (0 si pas encore commencée, montant complet si
-- déjà terminée à la date p_as_of).
CREATE OR REPLACE FUNCTION public.calculate_project_evm(p_project_id uuid, p_as_of timestamptz DEFAULT now())
RETURNS TABLE (pv numeric, ev numeric, ac numeric, bac numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_bac numeric;
  v_ac numeric;
  v_pv numeric := 0;
  v_ev numeric := 0;
  rec record;
BEGIN
  SELECT COALESCE(SUM(bl.montant_prevu), 0), COALESCE(SUM(bl.montant_paye), 0)
  INTO v_bac, v_ac
  FROM public.budget_lignes bl
  JOIN public.budget_versions bv ON bv.id = bl.version_id
  WHERE bv.project_id = p_project_id
    AND bl.deleted_at IS NULL
    AND bv.deleted_at IS NULL;

  FOR rec IN
    SELECT montant_prevu, taux_realisation, date_debut_prevue, date_fin_prevue
    FROM public.ptba_activites
    WHERE project_id = p_project_id AND deleted_at IS NULL
  LOOP
    v_ev := v_ev + COALESCE(rec.montant_prevu, 0) * COALESCE(rec.taux_realisation, 0) / 100;

    IF rec.date_debut_prevue IS NOT NULL AND rec.date_fin_prevue IS NOT NULL THEN
      IF p_as_of >= rec.date_fin_prevue THEN
        v_pv := v_pv + COALESCE(rec.montant_prevu, 0);
      ELSIF p_as_of > rec.date_debut_prevue THEN
        v_pv := v_pv + COALESCE(rec.montant_prevu, 0) * (
          EXTRACT(EPOCH FROM (p_as_of - rec.date_debut_prevue))
          / NULLIF(EXTRACT(EPOCH FROM (rec.date_fin_prevue - rec.date_debut_prevue)), 0)
        );
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_pv, v_ev, v_ac, v_bac;
END;
$$;

-- ── Génération des instantanés EVM pour tous les projets actifs ───────────
-- Idempotent par (projet, période) : supprime puis réinsère plutôt qu'un
-- ON CONFLICT, pour ne pas dépendre d'une contrainte unique préexistante sur
-- une table jamais gérée en écriture jusqu'ici.
CREATE OR REPLACE FUNCTION public.generate_evm_snapshots()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_periode text := to_char(now(), 'YYYY-MM');
  v_count integer := 0;
  rec record;
  v_evm record;
BEGIN
  FOR rec IN
    SELECT id FROM public.projects WHERE deleted_at IS NULL AND statut <> 'CLOTURE'
  LOOP
    SELECT * INTO v_evm FROM public.calculate_project_evm(rec.id);

    DELETE FROM public.evm_snapshots WHERE project_id = rec.id AND periode = v_periode;
    INSERT INTO public.evm_snapshots (id, project_id, periode, pv, ev, ac)
    VALUES (gen_random_uuid(), rec.id, v_periode, v_evm.pv, v_evm.ev, v_evm.ac);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
