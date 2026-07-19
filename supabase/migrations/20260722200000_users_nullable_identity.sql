-- ═══════════════════════════════════════════════════════════════════════════
-- Refonte gestion des membres — Phase 1, étape 1/3
-- ═══════════════════════════════════════════════════════════════════════════
-- Flux cible : un profil peut désormais être créé avec seulement un email
-- (statut "PENDING", cf. users.derniere_connexion IS NULL côté frontend) —
-- nom/prenom sont renseignés par l'utilisateur lui-même à sa première
-- connexion, plus par l'administrateur qui l'invite.
--
-- DROP NOT NULL est idempotent : si la contrainte n'existe pas (ou a déjà
-- été retirée), cette instruction ne fait rien et ne lève pas d'erreur —
-- sûr à exécuter même sans confirmation préalable de l'état exact du schéma
-- (table `users` pré-existante, jamais créée par une migration trackée ici).

ALTER TABLE public.users ALTER COLUMN nom    DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN prenom DROP NOT NULL;
