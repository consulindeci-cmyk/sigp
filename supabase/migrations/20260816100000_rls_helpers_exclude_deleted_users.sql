-- ═══════════════════════════════════════════════════════════════════════════
-- Révocation immédiate des utilisateurs supprimés — volet RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexte : users-delete fait un soft delete (deleted_at) sur public.users
-- puis un hard delete Supabase Auth (auth.admin.deleteUser). Ce dernier
-- invalide bien les refresh tokens de l'utilisateur (plus moyen d'obtenir un
-- nouvel access token), MAIS PostgREST vérifie les JWT localement (signature +
-- expiration) sans re-consulter auth.users à chaque requête : un access token
-- déjà émis et non expiré (TTL par défaut ~1h côté Supabase Auth) restait donc
-- pleinement valide pour toute requête directe supabase.from(...) — aucune API
-- Supabase (il n'existe pas de "admin.auth.signOut(userId)" par ID, seulement
-- "admin.auth.signOut(jwt)" qui exige le JWT vivant de la session à révoquer,
-- que l'on n'a pas dans users-delete) ne permet de révoquer ce token a priori.
--
-- Le vrai point de levier : current_app_user_id()/current_user_organisation_id()/
-- current_user_role()/is_admin() sont les 4 fonctions SECURITY DEFINER
-- utilisées par TOUTES les policies RLS de l'app (25+ migrations) pour
-- résoudre l'identité de l'appelant — mais aucune ne vérifiait deleted_at.
-- En ajoutant ce filtre ici, un utilisateur supprimé voit CES fonctions
-- retourner NULL/false immédiatement, quelle que soit la validité résiduelle
-- de son JWT : is_admin() devient false, current_user_organisation_id()
-- devient NULL, current_user_role() devient NULL — toute policy de la forme
-- "is_admin() OR X = current_user_organisation_id()" ou "current_user_role()
-- IN (...)" se referme donc instantanément sur l'ensemble du périmètre RLS,
-- sans attendre l'expiration naturelle du token.
--
-- Note : la policy users_select_self_or_admin (auth_user_id = auth.uid(),
-- sans passer par ces helpers) reste volontairement inchangée — elle permet
-- au frontend de lire encore son propre profil (avec deleted_at renseigné)
-- pour détecter la suppression et déclencher un signOut() côté client
-- (cf. authStore.ts), plutôt que de se retrouver avec un profil totalement
-- invisible et une erreur RLS silencieuse.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.current_user_organisation_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organisation_id FROM public.users WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
$$;

-- Reprend fidèlement la définition SUPER_ADMIN de 20260717130000_is_admin_super_admin_bascule.sql,
-- en y ajoutant uniquement le filtre deleted_at.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'SUPER_ADMIN' FROM public.users WHERE auth_user_id = auth.uid() AND deleted_at IS NULL), false);
$$;
