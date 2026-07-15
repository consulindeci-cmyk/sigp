-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module Contrats
-- ═══════════════════════════════════════════════════════════════════════════
-- Même pattern que Risques/WBS : lecture scoping org, écriture COORDINATEUR/
-- CHARGE_PROGRAMME/ADMIN, suppression ADMIN seul.

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_select ON public.contracts;
CREATE POLICY contracts_select ON public.contracts
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS contracts_insert ON public.contracts;
CREATE POLICY contracts_insert ON public.contracts
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS contracts_update ON public.contracts;
CREATE POLICY contracts_update ON public.contracts
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS contracts_delete ON public.contracts;
CREATE POLICY contracts_delete ON public.contracts
  FOR DELETE USING (current_user_role() = 'ADMIN');
