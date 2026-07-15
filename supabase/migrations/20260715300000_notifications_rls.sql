-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — module Notifications (CRUD fidèle,
-- sans automatisation — voir mémoire projet pour le contexte)
-- ═══════════════════════════════════════════════════════════════════════════
-- Design volontairement DIFFÉRENT du pattern org-scoping utilisé sur les 9
-- modules précédents : une notification appartient à un UTILISATEUR
-- (user_id), pas à un projet — donc scoping par utilisateur, pas par
-- organisation.
--
-- NestJS a `@ApiAuth(UserRole.ADMIN)` sur tout le contrôleur (lecture
-- comprise) — vérifié incohérent avec l'usage réel : un utilisateur normal
-- ne pourrait jamais lire ni marquer comme lues ses propres notifications.
-- C'est le même schéma d'oversight déjà rencontré sur Risques/WBS/Livrables/
-- Budget (ADMIN-only sur tout un contrôleur, y compris la lecture) — traité
-- de la même façon : lecture ouverte (mais ici scoping par utilisateur, pas
-- par organisation), écriture restreinte.

CREATE OR REPLACE FUNCTION public.same_organisation_as_current_user(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organisation_id FROM public.users WHERE id = p_target_user_id)
    = current_user_organisation_id(),
    false
  );
$$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT : chacun voit ses propres notifications, ADMIN voit tout.
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR user_id = current_app_user_id())
  );

-- INSERT : COORDINATEUR/CHARGE_PROGRAMME/ADMIN peuvent notifier quelqu'un,
-- mais seulement un utilisateur de leur propre organisation (sauf ADMIN).
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR same_organisation_as_current_user(user_id))
  );

-- UPDATE : chacun peut marquer ses propres notifications comme lues,
-- ADMIN peut modifier n'importe laquelle.
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING (
    is_admin() OR user_id = current_app_user_id()
  );

-- DELETE : réservé à ADMIN, comme sur tous les autres modules (la
-- suppression n'est pas le mécanisme prévu pour "traiter" une notification —
-- c'est le champ `lue` via UPDATE).
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING (current_user_role() = 'ADMIN');
