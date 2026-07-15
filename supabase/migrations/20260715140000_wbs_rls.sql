-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module WBS (wbs_nodes)
-- ═══════════════════════════════════════════════════════════════════════════
-- Réutilise project_organisation_id() déjà créée. Même schéma de rôles que
-- Risques : lecture scoping org pour tous les rôles, écriture COORDINATEUR/
-- CHARGE_PROGRAMME/ADMIN, suppression ADMIN seul (déviation assumée et
-- validée par rapport au NestJS actuel @ApiAuth(ADMIN) sur tout le contrôleur).

ALTER TABLE public.wbs_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wbs_nodes_select ON public.wbs_nodes;
CREATE POLICY wbs_nodes_select ON public.wbs_nodes
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS wbs_nodes_insert ON public.wbs_nodes;
CREATE POLICY wbs_nodes_insert ON public.wbs_nodes
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS wbs_nodes_update ON public.wbs_nodes;
CREATE POLICY wbs_nodes_update ON public.wbs_nodes
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS wbs_nodes_delete ON public.wbs_nodes;
CREATE POLICY wbs_nodes_delete ON public.wbs_nodes
  FOR DELETE USING (current_user_role() = 'ADMIN');
