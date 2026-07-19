-- ═══════════════════════════════════════════════════════════════════════════
-- Cadre Logique — verrouillage multi-tenant des policies DELETE
-- ═══════════════════════════════════════════════════════════════════════════
-- logframe_objectives_delete / logframe_indicators_delete n'avaient aucune
-- clause d'organisation (contrairement à SELECT/INSERT/UPDATE, toutes sous la
-- forme `is_admin() OR X = current_user_organisation_id()`) : un ADMIN
-- (org-scopé) pouvait en théorie, via ces policies seules, soft-supprimer les
-- objectifs/indicateurs d'une AUTRE organisation. En pratique les Edge
-- Functions vérifient déjà l'organisation avant suppression (client
-- service_role, bypass RLS), donc pas d'exploitation possible aujourd'hui —
-- mais cette policy reste le filet de sécurité si jamais un appel direct au
-- SDK authentifié contournait un jour l'Edge Function. Alignée ici sur le
-- même schéma que les autres policies du module.

DROP POLICY IF EXISTS logframe_objectives_delete ON public.logframe_objectives;
CREATE POLICY logframe_objectives_delete ON public.logframe_objectives
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_indicators_delete ON public.logframe_indicators;
CREATE POLICY logframe_indicators_delete ON public.logframe_indicators
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR logframe_objective_organisation_id(objective_id) = current_user_organisation_id())
  );
