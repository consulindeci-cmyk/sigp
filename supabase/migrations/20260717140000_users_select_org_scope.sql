-- Multi-tenant Phase 1 — correctif découvert en traçant les conséquences de la
-- bascule is_admin() : la policy users_select_self_or_admin
-- (is_admin() OR auth_user_id = auth.uid()) n'avait AUCUNE branche de
-- cloisonnement par organisation. Avant la bascule, is_admin()=ADMIN couvrait
-- implicitement tout le monde ; après (is_admin()=SUPER_ADMIN uniquement), un
-- org_admin (rôle ADMIN scopé) ne verrait plus que lui-même dans la page
-- Utilisateurs — impossible de gérer son équipe. Ajout de la branche manquante,
-- cohérente avec le pattern déjà utilisé partout ailleurs (organisations,
-- projects, directions, etc.).

DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
CREATE POLICY users_select_self_or_admin ON public.users
  FOR SELECT USING (
    is_admin()
    OR auth_user_id = auth.uid()
    OR organisation_id = current_user_organisation_id()
  );
