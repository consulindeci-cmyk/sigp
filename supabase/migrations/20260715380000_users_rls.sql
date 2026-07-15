-- ═══════════════════════════════════════════════════════════════════════════
-- GRAND CHANTIER — Phase 3, module Users/RBAC
-- ═══════════════════════════════════════════════════════════════════════════
-- Réutilise les helpers déjà créés par la migration pilote (is_admin(),
-- current_user_organisation_id()) — aucun nouveau helper SQL nécessaire.
--
-- email a une VRAIE contrainte UNIQUE en base (contrairement au code mort
-- trouvé sur WBS/PTBA/Logframe) — un email soft-deleted bloque toujours la
-- réutilisation, fidèlement conservé.
--
-- Déviation assumée et validée par l'utilisateur : UsersController NestJS
-- est ADMIN-only pour TOUTE opération, y compris la lecture. La policy
-- SELECT ci-dessous étend la lecture aux membres de la même organisation
-- (nécessaire pour peupler les sélecteurs "responsable" dans WBS/PTBA/PPM/
-- Livrables) — ce n'est pas une correction d'oversight comme ailleurs, mais
-- une extension de droits explicitement demandée.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR organisation_id = current_user_organisation_id())
  );

-- INSERT/UPDATE toujours via Edge Function (client service_role, bypass RLS)
-- — policies présentes en défense en profondeur contre un appel direct via
-- le SDK avec le JWT d'un utilisateur authentifié.
DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (is_admin());

-- Pas de policy DELETE : suppression logique uniquement (deleted_at via
-- UPDATE), fidèle à UsersRepository.softDelete().
