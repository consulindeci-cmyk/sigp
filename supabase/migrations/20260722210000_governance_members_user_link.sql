-- ═══════════════════════════════════════════════════════════════════════════
-- Refonte gestion des membres — Phase 1, étape 2/3
-- ═══════════════════════════════════════════════════════════════════════════
-- Équipe Projet doit désormais être rattachée à un utilisateur réel de
-- l'organisation (sélecteur, plus de saisie libre) — Comité de Pilotage,
-- Parties Prenantes et Contacts restent en saisie libre : leurs membres sont
-- très souvent des représentants externes (bailleurs, ministères,
-- partenaires) qui n'ont pas vocation à devenir des utilisateurs de la
-- plateforme.
--
-- user_id nullable : les lignes historiques (saisies à la main avant cette
-- migration) restent valides sans rétro-remplissage. nom/prenom deviennent un
-- instantané copié depuis `users` au moment de la sélection (par l'Edge
-- Function), plus jamais resaisis à la main une fois user_id renseigné —
-- même principe que historique.avant/apres.

ALTER TABLE public.project_team_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.project_team_members(user_id) WHERE deleted_at IS NULL;

-- Un utilisateur PENDING (jamais connecté, cf. users.derniere_connexion IS
-- NULL) sélectionnable dans le vivier a nom/prenom encore NULL — l'instantané
-- copié à la sélection doit donc pouvoir porter cette absence, plutôt que de
-- bloquer l'ajout du membre tant qu'il n'a pas complété son profil.
ALTER TABLE public.project_team_members
  ALTER COLUMN nom DROP NOT NULL,
  ALTER COLUMN prenom DROP NOT NULL;
