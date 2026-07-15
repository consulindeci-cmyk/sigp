-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module Livrables (Jalons)
-- ═══════════════════════════════════════════════════════════════════════════
-- "Jalons" n'est pas une table dédiée : un jalon est un Livrable avec une
-- date_prevue à venir (calculé côté NestJS dans ProjectService.getMilestones).
-- Même pattern de rôles que Risques/WBS/Contrats.

ALTER TABLE public.livrables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS livrables_select ON public.livrables;
CREATE POLICY livrables_select ON public.livrables
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS livrables_insert ON public.livrables;
CREATE POLICY livrables_insert ON public.livrables
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS livrables_update ON public.livrables;
CREATE POLICY livrables_update ON public.livrables
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS livrables_delete ON public.livrables;
CREATE POLICY livrables_delete ON public.livrables
  FOR DELETE USING (current_user_role() = 'ADMIN');
