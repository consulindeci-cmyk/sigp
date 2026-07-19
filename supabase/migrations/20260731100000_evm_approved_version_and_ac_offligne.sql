-- ═══════════════════════════════════════════════════════════════════════════
-- Immunisation du moteur EVM — suite de l'audit Indicateurs EVM
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat de l'audit : calculate_project_evm() sommait BAC/AC sur TOUTES les
-- budget_versions non supprimées d'un projet (BROUILLON/SOUMIS/EN_REVISION/
-- APPROUVE/ARCHIVE confondus) — un projet ayant plus d'une version vivante
-- voyait son BAC/AC compté en double. Elle ne lisait par ailleurs QUE
-- budget_lignes.montant_paye pour l'AC, sans les décaissements DECAISSE
-- rattachés uniquement à un Contrat/une Source de financement (même angle
-- mort déjà corrigé sur project_montant_paye_view / project-detail-summary /
-- dashboard-summary, jamais répercuté ici).
--
-- Corrigé :
--   1. BAC et la part "lignes" de l'AC ne comptent plus que la version
--      budgétaire au statut APPROUVE (bv.statut = 'APPROUVE').
--   2. L'AC intègre désormais aussi les décaissements DECAISSE sans
--      budget_ligne_id, résolus vers ce projet via budget_version_id /
--      contract_id / funding_source_id (même logique de résolution que
--      project_montant_paye_view, pour que l'AC de l'EVM concorde avec le
--      "montant payé" affiché ailleurs dans l'application).
--
-- Note transparente : project_montant_paye_view (cartes de la liste des
-- projets) et project-detail-summary/dashboard-summary (en-tête, portefeuille)
-- N'appliquent PAS ce filtre "APPROUVE uniquement" — ils continuent de sommer
-- toutes les versions non supprimées. Un projet avec plusieurs versions
-- budgétaires vivantes simultanément peut donc désormais afficher un
-- BAC/AC légèrement différent entre l'EVM et le reste de l'application.
-- Signalé explicitement à l'utilisateur, non corrigé ici (hors périmètre de
-- cette instruction, qui ne portait que sur calculate_project_evm).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calculate_project_evm(p_project_id uuid, p_as_of timestamptz DEFAULT now())
RETURNS TABLE (pv numeric, ev numeric, ac numeric, bac numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_bac numeric;
  v_ac_lignes numeric;
  v_ac_hors_ligne numeric;
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

  -- BAC / AC (part lignes) : uniquement la version budgétaire APPROUVEE.
  SELECT COALESCE(SUM(bl.montant_prevu), 0), COALESCE(SUM(bl.montant_paye), 0)
  INTO v_bac, v_ac_lignes
  FROM public.budget_lignes bl
  JOIN public.budget_versions bv ON bv.id = bl.version_id
  WHERE bv.project_id = p_project_id
    AND bl.deleted_at IS NULL
    AND bv.deleted_at IS NULL
    AND bv.statut = 'APPROUVE';

  -- AC (part hors ligne) : décaissements DECAISSE sans budget_ligne_id,
  -- résolus vers ce projet via budget_version_id, contract_id ou
  -- funding_source_id (COALESCE : une même ligne ne peut jamais être comptée
  -- deux fois même si plusieurs rattachements sont renseignés à la fois).
  SELECT COALESCE(SUM(d.montant), 0)
  INTO v_ac_hors_ligne
  FROM public.disbursements d
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      (SELECT bv.project_id FROM public.budget_versions bv WHERE bv.id = d.budget_version_id AND bv.deleted_at IS NULL),
      (SELECT c.project_id FROM public.contracts c WHERE c.id = d.contract_id AND c.deleted_at IS NULL),
      (SELECT fs.project_id FROM public.funding_sources fs WHERE fs.id = d.funding_source_id AND fs.deleted_at IS NULL)
    ) AS project_id
  ) resolved
  WHERE d.statut = 'DECAISSE'
    AND d.budget_ligne_id IS NULL
    AND d.deleted_at IS NULL
    AND resolved.project_id = p_project_id;

  v_ac := v_ac_lignes + v_ac_hors_ligne;

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
