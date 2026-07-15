-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — module Logframe (Objectives + Indicators)
-- ═══════════════════════════════════════════════════════════════════════════
-- Traités ensemble : un indicateur n'existe jamais sans objectif parent
-- (objective_id NOT NULL, FK cascade), même logique de regroupement que
-- PPM/PPM-Étapes et Budget Versions/Lignes.
--
-- logframe_objectives a project_id en colonne directe → réutilise
-- project_organisation_id() sans nouveau helper.
-- logframe_indicators n'a PAS de project_id direct (seulement objective_id)
-- → nouveau helper logframe_objective_organisation_id(), même pattern que
-- ppm_marche_organisation_id() pour ppm_etapes.
--
-- Les deux tables ont un deleted_at classique (soft delete standard, pas de
-- particularité comme ppm_etapes).
--
-- Pas de contrainte unique DB sur (project_id, code) ni (objective_id, code) :
-- comme WBS et PTBA, mapUniqueViolation() côté service n'a aucun @@unique
-- réel derrière — code défensif mort, handling 23505 gardé par parité.
--
-- Quirk fidèlement reproduit (pas une régression introduite ici) :
-- LogframeObjectiveService.create/update vérifie seulement l'EXISTENCE du
-- parentId, jamais qu'il appartient au même projet (contrairement à WBS qui
-- fait cette double vérification). Comportement d'origine NestJS, reproduit
-- tel quel dans les Edge Functions.

CREATE OR REPLACE FUNCTION public.logframe_objective_organisation_id(p_objective_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(lo.project_id)
  FROM public.logframe_objectives lo
  WHERE lo.id = p_objective_id;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- logframe_objectives — pattern standard
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.logframe_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logframe_objectives_select ON public.logframe_objectives;
CREATE POLICY logframe_objectives_select ON public.logframe_objectives
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_objectives_insert ON public.logframe_objectives;
CREATE POLICY logframe_objectives_insert ON public.logframe_objectives
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_objectives_update ON public.logframe_objectives;
CREATE POLICY logframe_objectives_update ON public.logframe_objectives
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_objectives_delete ON public.logframe_objectives;
CREATE POLICY logframe_objectives_delete ON public.logframe_objectives
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────────
-- logframe_indicators — via logframe_objective_organisation_id()
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.logframe_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logframe_indicators_select ON public.logframe_indicators;
CREATE POLICY logframe_indicators_select ON public.logframe_indicators
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR logframe_objective_organisation_id(objective_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_indicators_insert ON public.logframe_indicators;
CREATE POLICY logframe_indicators_insert ON public.logframe_indicators
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR logframe_objective_organisation_id(objective_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_indicators_update ON public.logframe_indicators;
CREATE POLICY logframe_indicators_update ON public.logframe_indicators
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR logframe_objective_organisation_id(objective_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS logframe_indicators_delete ON public.logframe_indicators;
CREATE POLICY logframe_indicators_delete ON public.logframe_indicators
  FOR DELETE USING (current_user_role() = 'ADMIN');
