-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, chantier Budget (5/5, dernière
-- étape) : journal_operations
-- ═══════════════════════════════════════════════════════════════════════════
-- Le plus simple des 5 : budget_ligne_id est OBLIGATOIRE (contrairement aux
-- 4 références facultatives de disbursements) — réutilise directement
-- budget_line_organisation_id() déjà créée, aucune nouvelle fonction requise.
-- Même pattern de rôles que les 4 étapes précédentes (FINANCIER inclus).

ALTER TABLE public.journal_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_operations_select ON public.journal_operations;
CREATE POLICY journal_operations_select ON public.journal_operations
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR budget_line_organisation_id(budget_ligne_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS journal_operations_insert ON public.journal_operations;
CREATE POLICY journal_operations_insert ON public.journal_operations
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR budget_line_organisation_id(budget_ligne_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS journal_operations_update ON public.journal_operations;
CREATE POLICY journal_operations_update ON public.journal_operations
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR budget_line_organisation_id(budget_ligne_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS journal_operations_delete ON public.journal_operations;
CREATE POLICY journal_operations_delete ON public.journal_operations
  FOR DELETE USING (current_user_role() = 'ADMIN');
