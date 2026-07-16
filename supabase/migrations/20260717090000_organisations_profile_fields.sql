-- La table `organisations` existe déjà (ancrage de la hiérarchie organisationnelle,
-- cf. current_user_organisation_id()) mais ne portait aucun champ de profil —
-- rien ne l'utilisait jusqu'ici côté frontend. On ajoute les champs nécessaires
-- à la section "Organisation" des Paramètres (ADD COLUMN IF NOT EXISTS : ne
-- suppose rien sur ce qui existe déjà réellement sur cette table pré-existante).

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS nom        text,
  ADD COLUMN IF NOT EXISTS adresse    text,
  ADD COLUMN IF NOT EXISTS ville      text,
  ADD COLUMN IF NOT EXISTS pays       text,
  ADD COLUMN IF NOT EXISTS telephone  text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS site_web   text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
