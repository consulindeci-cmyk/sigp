-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif — generate_evm_snapshots() : evm_snapshots stocke le jeu complet
-- d'indicateurs dérivés (sv/cv/spi/cpi/eac/etc/vac/tcpi), pas seulement
-- pv/ev/ac/bac
-- ═══════════════════════════════════════════════════════════════════════════
-- Suite du correctif précédent (20260802100000, qui a révélé que "bac" était
-- NOT NULL et manquant) : la même erreur se reproduit maintenant sur "eac" —
-- signe que la table evm_snapshots a été conçue pour stocker l'intégralité
-- des indicateurs EVM dérivés (le même jeu que l'interface EvmSummary côté
-- frontend : pv, ev, ac, sv, cv, spi, cpi, bac, eac, etc, vac, tcpi), pas
-- seulement les 4 valeurs brutes retournées par calculate_project_evm().
-- generate_evm_snapshots() n'a jamais calculé ces ratios dérivés.
--
-- Note : contrairement à useEvm.ts (calcul live, où EAC peut valoir
-- +Infinity dans le cas critique ac > 0 / ev = 0, cf. migration EVM
-- précédente), une colonne `numeric` ne peut PAS stocker Infinity/NaN. Pour
-- l'instantané archivé, ce cas retombe donc sur la formule simple
-- (eac = bac si cpi = 0), qui reste une valeur numérique valide — seul
-- l'affichage "temps réel" (RPC directe, jamais depuis un snapshot) porte la
-- distinction "Dérive critique".
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_evm_snapshots()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_periode text := to_char(now(), 'YYYY-MM');
  v_count integer := 0;
  rec record;
  v_evm record;
  v_sv numeric;
  v_cv numeric;
  v_spi numeric;
  v_cpi numeric;
  v_eac numeric;
  v_etc numeric;
  v_vac numeric;
  v_tcpi numeric;
BEGIN
  FOR rec IN
    SELECT id FROM public.projects WHERE deleted_at IS NULL AND statut <> 'CLOTURE'
  LOOP
    SELECT * INTO v_evm FROM public.calculate_project_evm(rec.id);

    v_sv   := v_evm.ev - v_evm.pv;
    v_cv   := v_evm.ev - v_evm.ac;
    v_spi  := CASE WHEN v_evm.pv > 0 THEN v_evm.ev / v_evm.pv ELSE 1 END;
    v_cpi  := CASE WHEN v_evm.ac > 0 THEN v_evm.ev / v_evm.ac ELSE 1 END;
    v_eac  := CASE WHEN v_cpi > 0 THEN v_evm.bac / v_cpi ELSE v_evm.bac END;
    v_etc  := v_eac - v_evm.ac;
    v_vac  := v_evm.bac - v_eac;
    v_tcpi := CASE WHEN (v_evm.bac - v_evm.ac) <> 0 THEN (v_evm.bac - v_evm.ev) / (v_evm.bac - v_evm.ac) ELSE 1 END;

    DELETE FROM public.evm_snapshots WHERE project_id = rec.id AND periode = v_periode;
    INSERT INTO public.evm_snapshots
      (id, project_id, periode, pv, ev, ac, bac, sv, cv, spi, cpi, eac, etc, vac, tcpi)
    VALUES
      (gen_random_uuid(), rec.id, v_periode, v_evm.pv, v_evm.ev, v_evm.ac, v_evm.bac,
       v_sv, v_cv, v_spi, v_cpi, v_eac, v_etc, v_vac, v_tcpi);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
