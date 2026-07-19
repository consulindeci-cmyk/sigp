-- ═══════════════════════════════════════════════════════════════════════════
-- WBS — verrouillage multi-tenant de la policy DELETE
-- ═══════════════════════════════════════════════════════════════════════════
-- wbs_nodes_delete n'avait aucune clause d'organisation (contrairement à
-- SELECT/INSERT/UPDATE, toutes sous la forme `is_admin() OR X =
-- current_user_organisation_id()`) : un ADMIN (org-scopé) pouvait en théorie,
-- via cette policy seule, soft-supprimer les nœuds WBS d'une AUTRE
-- organisation. Même constat et même correctif que sur
-- logframe_objectives_delete / logframe_indicators_delete / ptba_activites_delete.

DROP POLICY IF EXISTS wbs_nodes_delete ON public.wbs_nodes;
CREATE POLICY wbs_nodes_delete ON public.wbs_nodes
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
