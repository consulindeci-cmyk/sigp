-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — module PTBA (activités du plan de travail
-- budget annuel)
-- ═══════════════════════════════════════════════════════════════════════════
-- project_id est une colonne directe sur ptba_activites (comme Risques/WBS/
-- Contrats/Livrables) → réutilise project_organisation_id() sans nouveau
-- helper. Table standard : deleted_at présent, soft delete classique
-- (contrairement à ppm_etapes qui fait un vrai DELETE).
--
-- Rattachements optionnels wbs_id / logframe_ref_id : la cohérence de projet
-- (le nœud WBS / l'objectif de l'indicateur doit appartenir au même projet)
-- est vérifiée dans les Edge Functions (comme PtbaService.validateLinks),
-- pas en RLS — c'est de la logique métier inter-tables, pas un contrôle
-- d'accès.
--
-- Pas de contrainte unique DB sur (project_id, code) : PtbaRepository n'a
-- pas de @@unique dans le schema Prisma malgré mapUniqueViolation() côté
-- service — même constat que sur WBS (code défensif mort). Le handling
-- 23505 est gardé dans l'Edge Function par parité, sans effet réel attendu.

ALTER TABLE public.ptba_activites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ptba_activites_select ON public.ptba_activites;
CREATE POLICY ptba_activites_select ON public.ptba_activites
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ptba_activites_insert ON public.ptba_activites;
CREATE POLICY ptba_activites_insert ON public.ptba_activites
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ptba_activites_update ON public.ptba_activites;
CREATE POLICY ptba_activites_update ON public.ptba_activites
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ptba_activites_delete ON public.ptba_activites;
CREATE POLICY ptba_activites_delete ON public.ptba_activites
  FOR DELETE USING (current_user_role() = 'ADMIN');
