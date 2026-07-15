-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module Risques
-- ═══════════════════════════════════════════════════════════════════════════
-- Réutilise project_organisation_id() déjà créée pour le module Projets.
-- Corrige au passage un trou identifié lors de l'audit Phase 18.1 : le
-- RisqueRepository NestJS (buildWhere) n'a jamais appliqué de filtre
-- organisationId — cette RLS l'impose désormais au niveau base, ce qui ne
-- peut plus être oublié par erreur dans un futur endpoint.

ALTER TABLE public.risques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS risques_select ON public.risques;
CREATE POLICY risques_select ON public.risques
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

-- Écriture réelle via Edge Functions (service_role, bypass RLS) — ces
-- policies sont un filet de sécurité si un appel direct était tenté.
DROP POLICY IF EXISTS risques_insert ON public.risques;
CREATE POLICY risques_insert ON public.risques
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS risques_update ON public.risques;
CREATE POLICY risques_update ON public.risques
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS risques_delete ON public.risques;
CREATE POLICY risques_delete ON public.risques
  FOR DELETE USING (current_user_role() = 'ADMIN');
