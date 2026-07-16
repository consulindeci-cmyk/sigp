-- ═══════════════════════════════════════════════════════════════════════════
-- Historique de connexion (SettingsPage.tsx, section Sécurité) — jamais backé,
-- la UI affichait une liste toujours vide (mockConnectionHistory n'était même
-- pas branché). Supabase Auth n'expose aucune API pour lister les connexions
-- passées ni les sessions par appareil (seul un signOut global/others/local
-- existe) — on capture donc nous-mêmes l'événement de connexion réussie.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.login_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_history_user ON public.login_history(user_id);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement son propre historique (ou ADMIN).
DROP POLICY IF EXISTS login_history_select ON public.login_history;
CREATE POLICY login_history_select ON public.login_history
  FOR SELECT USING (is_admin() OR user_id = current_app_user_id());

-- Écriture : l'utilisateur ne peut logger qu'un événement pour lui-même —
-- inséré directement par le client juste après signInWithPassword (pas besoin
-- d'Edge Function ici, aucune logique métier, juste un enregistrement).
DROP POLICY IF EXISTS login_history_insert ON public.login_history;
CREATE POLICY login_history_insert ON public.login_history
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

-- Pas de policy UPDATE/DELETE : historique en lecture seule après écriture.
