-- ═══════════════════════════════════════════════════════════════════════════
-- Journal des Opérations — visibilité des actions niveau organisation
-- ═══════════════════════════════════════════════════════════════════════════
-- historique_select ne rendait visibles que les lignes rattachées à un projet
-- (project_id IS NOT NULL). Toute action niveau organisation (création/
-- modification d'utilisateur, création/modification d'organisation) est
-- insérée avec project_id: null — donc invisible à tout le monde sauf
-- is_admin() (SUPER_ADMIN). Un org_admin ne pouvait jamais voir qui avait
-- créé ou modifié un utilisateur dans sa propre organisation.
--
-- organisation_id nullable : les lignes existantes (projet-scopées) restent
-- valides sans rétro-remplissage obligatoire, mais on les backfill quand même
-- ci-dessous pour cohérence — le chemin project_id continue de fonctionner
-- pour elles de toute façon.

ALTER TABLE public.historique
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id);

UPDATE public.historique
SET organisation_id = project_organisation_id(project_id)
WHERE organisation_id IS NULL AND project_id IS NOT NULL;

DROP POLICY IF EXISTS historique_select ON public.historique;
CREATE POLICY historique_select ON public.historique
  FOR SELECT USING (
    is_admin()
    OR (project_id IS NOT NULL AND project_organisation_id(project_id) = current_user_organisation_id())
    OR (organisation_id IS NOT NULL AND organisation_id = current_user_organisation_id())
  );
