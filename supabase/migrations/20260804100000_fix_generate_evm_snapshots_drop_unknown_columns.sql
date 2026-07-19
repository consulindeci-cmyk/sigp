-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif — evm_snapshots n'a pas de colonnes etc/vac/tcpi
-- ═══════════════════════════════════════════════════════════════════════════
-- La tentative précédente (20260803100000) a échoué à la validation du
-- schéma (pas une violation de contrainte) sur "etc" : column does not
-- exist. PostgreSQL valide la liste de colonnes d'un INSERT dans l'ordre
-- d'écriture et s'arrête à la première invalide — puisque l'erreur porte
-- précisément sur "etc" (13e colonne de la liste), tout ce qui la précède
-- (id, project_id, periode, pv, ev, ac, bac, sv, cv, spi, cpi, eac) est donc
-- confirmé exister. evm_snapshots stocke pv/ev/ac/bac + sv/cv/spi/cpi/eac,
-- mais pas etc/vac/tcpi (recalculables trivialement à partir des colonnes
-- stockées si un jour nécessaire — inutile de les persister).
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
BEGIN
  FOR rec IN
    SELECT id FROM public.projects WHERE deleted_at IS NULL AND statut <> 'CLOTURE'
  LOOP
    SELECT * INTO v_evm FROM public.calculate_project_evm(rec.id);

    v_sv  := v_evm.ev - v_evm.pv;
    v_cv  := v_evm.ev - v_evm.ac;
    v_spi := CASE WHEN v_evm.pv > 0 THEN v_evm.ev / v_evm.pv ELSE 1 END;
    v_cpi := CASE WHEN v_evm.ac > 0 THEN v_evm.ev / v_evm.ac ELSE 1 END;
    v_eac := CASE WHEN v_cpi > 0 THEN v_evm.bac / v_cpi ELSE v_evm.bac END;

    DELETE FROM public.evm_snapshots WHERE project_id = rec.id AND periode = v_periode;
    INSERT INTO public.evm_snapshots
      (id, project_id, periode, pv, ev, ac, bac, sv, cv, spi, cpi, eac)
    VALUES
      (gen_random_uuid(), rec.id, v_periode, v_evm.pv, v_evm.ev, v_evm.ac, v_evm.bac,
       v_sv, v_cv, v_spi, v_cpi, v_eac);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
