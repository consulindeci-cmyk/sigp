-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — DELETE sur risques et notifications : cloisonnement
-- organisationnel + compatibilité SUPER_ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat de l'audit Risques & Alertes : les deux policies DELETE ne
-- vérifiaient QUE `current_user_role() = 'ADMIN'`, sans aucun scoping par
-- organisation — un ADMIN de l'organisation A pouvait en théorie supprimer un
-- risque ou une notification appartenant à l'organisation B via un appel
-- direct à la base (les Edge Functions risques-delete/notifications-delete,
-- elles, valident déjà correctement l'organisation — cette policy n'est que
-- le filet de sécurité, mais il ne protégeait rien).
--
-- Note sur la composition booléenne : les correctifs précédents de ce
-- chantier (budget_versions/budget_lignes/funding_sources/disbursements/
-- ppm_marches/ppm_etapes/contracts) utilisaient tous la forme
-- `current_user_role() = 'ADMIN' AND (is_admin() OR org-scope)`. Avec
-- is_admin() qui teste désormais role = 'SUPER_ADMIN' (bascule multi-tenant),
-- cette forme est en réalité restée fermée à SUPER_ADMIN : la première
-- condition exige littéralement le rôle 'ADMIN', donc la branche is_admin()
-- de l'OR interne n'est jamais atteignable — un SUPER_ADMIN échoue déjà sur
-- le premier AND. Corrigé ici avec la forme correcte
-- `is_admin() OR (current_user_role() = 'ADMIN' AND org-scope)`, qui laisse
-- réellement passer SUPER_ADMIN (partout) et ADMIN (scopé à son organisation).
-- Les 7 tables précédentes partagent la même imprécision — signalé, non
-- corrigé dans cette migration (hors périmètre de cette instruction).
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS risques_delete ON public.risques;
CREATE POLICY risques_delete ON public.risques
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND same_organisation_as_current_user(user_id))
  );
