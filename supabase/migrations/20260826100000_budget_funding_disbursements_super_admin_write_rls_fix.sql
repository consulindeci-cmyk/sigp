-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — SUPER_ADMIN exclu par erreur des policies INSERT/UPDATE de
-- budget_versions, budget_lignes, funding_sources, disbursements
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (nettoyage transversal Budget/WBS/PTBA/Cadre Logique) : le
-- 20260808100000_fix_super_admin_delete_rls_7_tables.sql avait déjà corrigé
-- la policy DELETE de ces 4 tables (parmi 7), mais leurs policies INSERT et
-- UPDATE d'origine (20260715240000/20260715260000) utilisaient encore
-- l'ancienne forme `current_user_role() IN (...) AND (is_admin() OR
-- org-scope)` — jamais migrée vers `is_admin() OR (rôle(s) AND org-scope)`.
-- Avec cette composition, un SUPER_ADMIN échoue sur la première moitié du
-- AND (son rôle littéral n'est jamais dans la liste COORDINATEUR/
-- CHARGE_PROGRAMME/FINANCIER/ADMIN), donc la branche is_admin() de l'OR
-- interne n'est jamais atteinte : SUPER_ADMIN ne pouvait créer/modifier
-- aucune ligne sur ces 4 tables en écriture directe (RLS), alors que
-- l'intention (cf. is_admin() partout ailleurs) est qu'il opère sans
-- restriction. Même bug, même correctif que le 20260822 (PTBA/WBS/Logframe)
-- et le 20260808 (DELETE), étendu ici au reste du périmètre Budget.
--
-- Sans impact pratique aujourd'hui : les écritures passent exclusivement par
-- les Edge Functions (client service_role, qui bypass RLS) — ce correctif
-- comble un filet de sécurité, pas un blocage observé en production.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- budget_versions
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS budget_versions_insert ON public.budget_versions;
CREATE POLICY budget_versions_insert ON public.budget_versions
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS budget_versions_update ON public.budget_versions;
CREATE POLICY budget_versions_update ON public.budget_versions
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- budget_lignes
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS budget_lignes_insert ON public.budget_lignes;
CREATE POLICY budget_lignes_insert ON public.budget_lignes
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND budget_version_organisation_id(version_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS budget_lignes_update ON public.budget_lignes;
CREATE POLICY budget_lignes_update ON public.budget_lignes
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND budget_version_organisation_id(version_id) = current_user_organisation_id()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- funding_sources
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS funding_sources_insert ON public.funding_sources;
CREATE POLICY funding_sources_insert ON public.funding_sources
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS funding_sources_update ON public.funding_sources;
CREATE POLICY funding_sources_update ON public.funding_sources
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- disbursements — org-scope résolue via disbursement_organisation_id()
-- (COALESCE des 4 chemins, cf. 20260715260000). L'INSERT d'origine n'avait
-- pas de clause d'organisation (la ligne n'existe pas encore au moment du
-- WITH CHECK) : seule la restriction de rôle est corrigée ici.
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS disbursements_insert ON public.disbursements;
CREATE POLICY disbursements_insert ON public.disbursements
  FOR INSERT WITH CHECK (
    is_admin()
    OR current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
  );

DROP POLICY IF EXISTS disbursements_update ON public.disbursements;
CREATE POLICY disbursements_update ON public.disbursements
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
      AND disbursement_organisation_id(id) = current_user_organisation_id()
    )
  );
