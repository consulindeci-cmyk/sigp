-- ═══════════════════════════════════════════════════════════════════════════
-- PTBA — verrouillage multi-tenant de la policy DELETE
-- ═══════════════════════════════════════════════════════════════════════════
-- ptba_activites_delete n'avait aucune clause d'organisation (contrairement à
-- SELECT/INSERT/UPDATE, toutes sous la forme `is_admin() OR X =
-- current_user_organisation_id()`) : un ADMIN (org-scopé) pouvait en théorie,
-- via cette policy seule, soft-supprimer les activités d'une AUTRE
-- organisation. Même constat et même correctif que sur
-- logframe_objectives_delete / logframe_indicators_delete
-- (20260723110000_logframe_delete_rls_org_scope.sql).

DROP POLICY IF EXISTS ptba_activites_delete ON public.ptba_activites;
CREATE POLICY ptba_activites_delete ON public.ptba_activites
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
