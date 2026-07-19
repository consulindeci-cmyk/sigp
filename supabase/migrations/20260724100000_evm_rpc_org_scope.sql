-- ═══════════════════════════════════════════════════════════════════════════
-- PTBA — sécurisation de la RPC calculate_project_evm (fuite inter-organisation)
-- ═══════════════════════════════════════════════════════════════════════════
-- calculate_project_evm() est SECURITY DEFINER (contourne RLS en interne) et
-- appelable directement par n'importe quel utilisateur authentifié via
-- supabase.rpc(...), sans aucune vérification d'organisation à l'intérieur.
-- Un utilisateur connaissant l'UUID d'un projet d'une AUTRE organisation
-- pouvait récupérer son BAC/AC/EV/PV confidentiels sans jamais passer par
-- project-detail-summary ni aucun contrôle applicatif.
--
-- Le garde-fou ne doit s'appliquer QUE lorsqu'un utilisateur authentifié
-- appelle réellement la fonction (frontend via supabase.rpc, JWT présent,
-- auth.uid() renseigné) — sinon on casserait :
--   - generate_evm_snapshots() appelée directement par pg_cron (aucune
--     session, auth.uid() IS NULL) ;
--   - evm-snapshot-generate, qui invoque generate_evm_snapshots() via le
--     client service_role (pas de JWT utilisateur non plus).
-- D'où la condition `auth.uid() IS NOT NULL AND NOT (...)` : un contexte
-- interne sans session reste de confiance, un appel utilisateur authentifié
-- est désormais strictement scopé à son organisation (ou is_admin()).

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
  IF auth.uid() IS NOT NULL AND NOT (
    is_admin() OR project_organisation_id(p_project_id) = current_user_organisation_id()
  ) THEN
    RAISE EXCEPTION 'Accès refusé : ce projet n''appartient pas à votre organisation' USING ERRCODE = '42501';
  END IF;

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
