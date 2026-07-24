-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — SUPER_ADMIN exclu par erreur des policies INSERT/UPDATE de
-- ppm_marches et ppm_etapes
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (nettoyage transversal module PPM) : ppm_marches_delete et
-- ppm_etapes_delete avaient déjà été corrigées par
-- 20260808100000_fix_super_admin_delete_rls_7_tables.sql, mais leurs
-- policies INSERT et UPDATE d'origine (20260715320000) utilisaient encore
-- l'ancienne forme `current_user_role() IN (...) AND (is_admin() OR
-- org-scope)` — jamais migrée, contrairement au reste du périmètre Budget
-- (20260826100000) et PTBA/WBS/Logframe (20260822100000). Ce sweep-là ne
-- couvrait pas le module PPM, laissant ce trou.
--
-- Même bug, même correctif : un SUPER_ADMIN échoue sur la première moitié
-- du AND (son rôle littéral n'est jamais dans la liste
-- COORDINATEUR/CHARGE_PROGRAMME/ADMIN), donc la branche is_admin() de l'OR
-- interne n'est jamais atteinte — SUPER_ADMIN ne pouvait créer/modifier
-- aucun marché ni aucune étape PPM en écriture directe (RLS), alors que
-- l'intention est qu'il opère sans restriction.
--
-- Sans impact pratique aujourd'hui : les écritures passent exclusivement par
-- les Edge Functions (client service_role, qui bypass RLS, avec leur propre
-- requireRole() incluant déjà SUPER_ADMIN) — ce correctif comble un filet de
-- sécurité, pas un blocage observé en production.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS ppm_marches_insert ON public.ppm_marches;
CREATE POLICY ppm_marches_insert ON public.ppm_marches
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS ppm_marches_update ON public.ppm_marches;
CREATE POLICY ppm_marches_update ON public.ppm_marches
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS ppm_etapes_insert ON public.ppm_etapes;
CREATE POLICY ppm_etapes_insert ON public.ppm_etapes
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND ppm_marche_organisation_id(marche_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS ppm_etapes_update ON public.ppm_etapes;
CREATE POLICY ppm_etapes_update ON public.ppm_etapes
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND ppm_marche_organisation_id(marche_id) = current_user_organisation_id()
    )
  );
