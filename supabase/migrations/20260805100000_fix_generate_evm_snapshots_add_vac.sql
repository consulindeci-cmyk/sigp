-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif — evm_snapshots.vac (et probablement tcpi) existent, contrairement à etc
-- ═══════════════════════════════════════════════════════════════════════════
-- Ma déduction précédente était incomplète : l'erreur "etc does not exist"
-- ne prouvait que l'invalidité d'"etc" lui-même, pas celle de "vac"/"tcpi"
-- qui le suivaient dans la liste (PostgreSQL s'arrête au premier problème
-- rencontré, il ne dit rien des colonnes suivantes). En omettant "vac" de
-- l'INSERT, cette colonne (NOT NULL, sans défaut) recevait NULL implicitement
-- → violation de contrainte. Remise dans l'INSERT avec sa vraie valeur
-- (bac - eac).
--
-- "tcpi" est ajouté par anticipation dans ce même correctif : sv/cv/spi/cpi/
-- eac/vac se sont tous révélés être de vraies colonnes (seul "etc" ne
-- l'était pas) — pattern assez net pour parier que "tcpi" existe aussi
-- plutôt que d'attendre un aller-retour de plus pour le découvrir. Si
-- l'hypothèse est fausse, l'erreur "column tcpi does not exist" le
-- confirmera aussi clairement que pour "etc".
--
-- "etc" reste absent (confirmé inexistant).
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
    v_vac  := v_evm.bac - v_eac;
    v_tcpi := CASE WHEN (v_evm.bac - v_evm.ac) <> 0 THEN (v_evm.bac - v_evm.ev) / (v_evm.bac - v_evm.ac) ELSE 1 END;

    DELETE FROM public.evm_snapshots WHERE project_id = rec.id AND periode = v_periode;
    INSERT INTO public.evm_snapshots
      (id, project_id, periode, pv, ev, ac, bac, sv, cv, spi, cpi, eac, vac, tcpi)
    VALUES
      (gen_random_uuid(), rec.id, v_periode, v_evm.pv, v_evm.ev, v_evm.ac, v_evm.bac,
       v_sv, v_cv, v_spi, v_cpi, v_eac, v_vac, v_tcpi);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
