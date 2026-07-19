-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — SUPER_ADMIN exclu par erreur des 7 policies DELETE
-- précédentes (budget_versions, budget_lignes, funding_sources,
-- disbursements, ppm_marches, ppm_etapes, contracts)
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (audit Risques & Alertes) : ces 7 policies utilisaient la forme
-- `current_user_role() = 'ADMIN' AND (is_admin() OR org-scope)`. Depuis la
-- bascule multi-tenant, is_admin() teste role = 'SUPER_ADMIN' — avec cette
-- composition, un SUPER_ADMIN échoue déjà sur le premier AND (son rôle
-- littéral n'est pas 'ADMIN'), donc la branche is_admin() de l'OR interne
-- n'est jamais atteinte : SUPER_ADMIN ne pouvait supprimer AUCUNE ligne sur
-- ces 7 tables, alors que l'intention (cf. is_admin() partout ailleurs dans
-- l'app) est qu'il opère sans restriction.
--
-- Corrigé avec la forme utilisée pour risques_delete/notifications_delete
-- (20260807100000) : `is_admin() OR (current_user_role() = 'ADMIN' AND
-- org-scope)` — SUPER_ADMIN passe sans condition, ADMIN reste strictement
-- cloisonné à son organisation. Aucun changement de comportement pour ADMIN
-- (le cloisonnement organisationnel introduit par les migrations
-- précédentes est préservé à l'identique).
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS budget_versions_delete ON public.budget_versions;
CREATE POLICY budget_versions_delete ON public.budget_versions
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_lignes_delete ON public.budget_lignes;
CREATE POLICY budget_lignes_delete ON public.budget_lignes
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND budget_version_organisation_id(version_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS funding_sources_delete ON public.funding_sources;
CREATE POLICY funding_sources_delete ON public.funding_sources
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS disbursements_delete ON public.disbursements;
CREATE POLICY disbursements_delete ON public.disbursements
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND disbursement_organisation_id(id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_marches_delete ON public.ppm_marches;
CREATE POLICY ppm_marches_delete ON public.ppm_marches
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_etapes_delete ON public.ppm_etapes;
CREATE POLICY ppm_etapes_delete ON public.ppm_etapes
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS contracts_delete ON public.contracts;
CREATE POLICY contracts_delete ON public.contracts
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );
