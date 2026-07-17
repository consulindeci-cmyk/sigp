-- Multi-tenant Phase 1, étape 3/5 — LE levier central.
--
-- is_admin() est déjà appelée dans 25+ migrations RLS existantes
-- (organisations_select, projects_select, directions_select, unites_select,
-- programmes_select, users_select_self_or_admin, historique_select, etc.),
-- toutes sous la forme `is_admin() OR X = current_user_organisation_id()`.
--
-- En basculant cette seule fonction de `role = 'ADMIN'` à
-- `role = 'SUPER_ADMIN'`, TOUTES ces policies changent de comportement d'un
-- coup, sans toucher à un seul des fichiers de migration existants :
--   - SUPER_ADMIN continue de tout voir, toutes organisations (comportement
--     ADMIN actuel préservé pour les comptes promus).
--   - ADMIN (nouveau rôle "org_admin") tombe désormais dans la branche
--     `X = current_user_organisation_id()` — scopé à sa propre organisation.
--
-- ATTENTION : c'est le changement le plus à risque de toute la Phase 1.
-- Ne pas exécuter tant qu'aucun compte n'a été promu SUPER_ADMIN (sans quoi
-- PERSONNE ne passerait plus is_admin() et tous les comptes ADMIN existants
-- perdraient immédiatement leur vue globale actuelle). Voir le fichier de
-- suivi du plan pour l'ordre d'exécution exact.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'SUPER_ADMIN' FROM public.users WHERE auth_user_id = auth.uid()), false);
$$;
