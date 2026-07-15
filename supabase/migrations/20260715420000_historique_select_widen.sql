-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS : la policy historique_select existante ne permettait la
-- lecture qu'à ADMIN ou AUDITEUR — alors que le vrai HistoryController NestJS
-- autorise TOUS les rôles authentifiés (READ_ROLES = ADMIN, COORDINATEUR,
-- CHARGE_PROGRAMME, FINANCIER, AUDITEUR, VIEWER). Élargi ici pour correspondre
-- au comportement réel, tout en gardant le cloisonnement par organisation
-- pour les non-ADMIN.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS historique_select ON public.historique;
CREATE POLICY historique_select ON public.historique
  FOR SELECT USING (
    is_admin()
    OR (project_id IS NOT NULL AND project_organisation_id(project_id) = current_user_organisation_id())
  );
