-- "Mon compte" (page Paramètres) affichait Poste/Bio comme des champs
-- éditables-et-enregistrables, mais `users` n'avait aucune colonne pour les
-- recevoir — les changements étaient silencieusement perdus malgré le message
-- de succès affiché à l'utilisateur. On ajoute les colonnes pour de vrai.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS poste text,
  ADD COLUMN IF NOT EXISTS bio   text;
