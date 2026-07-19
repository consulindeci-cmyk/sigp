-- ═══════════════════════════════════════════════════════════════════════════
-- Refonte gestion des membres — Phase 1, étape 3/3
-- ═══════════════════════════════════════════════════════════════════════════
-- Comité de Pilotage reste en saisie libre (cf. 20260722210000) mais aligné
-- sur le même contrat que Parties Prenantes / Contacts : un membre externe
-- doit pouvoir être joint directement (email, téléphone), pas seulement
-- identifié par nom/fonction/organisation.

ALTER TABLE public.project_committee_members
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS telephone text NOT NULL DEFAULT '';
