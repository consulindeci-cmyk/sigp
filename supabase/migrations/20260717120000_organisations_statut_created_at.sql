-- Multi-tenant Phase 1, étape 2/5 : ajoute un statut de cycle de vie à
-- l'organisation (verrouillage logique via RLS, jamais de suppression physique
-- — cohérent avec le pattern soft-delete utilisé partout ailleurs dans l'app)
-- et created_at (absent jusqu'ici, contrairement à updated_at déjà ajouté en
-- 20260717090000).

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS statut     text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.organisations.statut IS
  'ACTIVE ou SUSPENDUE — verrouillage logique d''une organisation (pas de suppression physique).';
