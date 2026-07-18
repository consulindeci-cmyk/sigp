-- Modale de création d'organisation : nouveaux champs métiers.
-- devise_defaut : chaque organisation aura sa propre devise par défaut au
-- lieu du 'XOF' actuellement codé en dur dans projects-create — le
-- rattachement effectif de projects-create à cette valeur est un chantier
-- séparé, non fait ici (cette migration ne fait que stocker le champ).
-- identifiant_fiscal : numéro d'enregistrement/fiscal, générique (pas de
-- format imposé, contexte multi-pays).
-- max_projects : quota invisible, aucune UI ni enforcement pour l'instant —
-- prépare un futur système de plans/quotas sans alourdir le formulaire
-- actuel. Valeur par défaut réelle en base (pas un défaut Prisma fantôme :
-- cette colonne est créée directement ici avec DEFAULT, donc le défaut
-- s'applique même sans le fournir explicitement dans l'INSERT).
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS devise_defaut     text NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS identifiant_fiscal text,
  ADD COLUMN IF NOT EXISTS max_projects       integer NOT NULL DEFAULT 10;

COMMENT ON COLUMN public.organisations.devise_defaut IS
  'Devise par défaut de cette organisation (XOF/EUR/USD) — destinée à terme à remplacer le XOF codé en dur dans projects-create.';
COMMENT ON COLUMN public.organisations.max_projects IS
  'Quota de projets — invisible en UI pour l''instant, aucun enforcement, prépare un futur système de plans.';
