-- ═══════════════════════════════════════════════════════════════════════════
-- Purge définitive des budget_lignes fantômes héritées de l'ancien assistant
-- de création de projet (wbs_id IS NULL)
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexte : l'ancienne étape "Budget initial" du wizard (ProjectCreateModal
-- + useCreateProjectWizard) créait une budget_lignes par composante déclarée,
-- SANS rattachement WBS (wbs_id n'existait même pas encore à l'époque), pour
-- forcer l'égalité entre lignes budgétaires et sources de financement. Cette
-- étape a été supprimée du wizard (le découpage se fait désormais à 100% via
-- le WBS, 1.0/2.0...), et BudgetMatrix.tsx masquait déjà ces lignes du
-- tableau et du TOTAL GÉNÉRAL ("Sans composante WBS"). Cette migration
-- supprime définitivement ces lignes de la base — elles n'ont plus aucune
-- utilité et ne doivent plus jamais apparaître, même masquées.
--
-- Garde-fou : on ne purge PAS une ligne qui porte un décaissement réel
-- (disbursements.budget_ligne_id) — la colonne est en ON DELETE SET NULL,
-- donc rien n'empêcherait techniquement la suppression, mais une ligne avec
-- un décaissement associé n'est par définition pas une ligne fantôme jamais
-- utilisée : elle est exclue du périmètre de cette purge et laissée en l'état
-- pour investigation manuelle si un tel cas existe.

DO $$
DECLARE
  v_purged_count int;
  v_skipped_count int;
BEGIN
  SELECT count(*) INTO v_skipped_count
  FROM public.budget_lignes bl
  WHERE bl.wbs_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.disbursements d WHERE d.budget_ligne_id = bl.id
    );

  IF v_skipped_count > 0 THEN
    RAISE NOTICE '% ligne(s) sans wbs_id ignorée(s) car un décaissement réel y est rattaché (à traiter manuellement)', v_skipped_count;
  END IF;

  DELETE FROM public.budget_lignes bl
  WHERE bl.wbs_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.disbursements d WHERE d.budget_ligne_id = bl.id
    );

  GET DIAGNOSTICS v_purged_count = ROW_COUNT;
  RAISE NOTICE '% ligne(s) budgétaire(s) fantôme(s) (wbs_id IS NULL) purgée(s) définitivement', v_purged_count;
END $$;
