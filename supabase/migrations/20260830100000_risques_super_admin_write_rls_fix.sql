-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — SUPER_ADMIN exclu par erreur des policies INSERT/UPDATE de
-- risques
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (audit + réalignement module Risques) : risques_delete avait déjà
-- été corrigée par 20260807100000_risques_notifications_delete_rls_fix.sql,
-- mais risques_insert et risques_update d'origine (20260715120000)
-- utilisaient encore l'ancienne forme `current_user_role() IN (...) AND
-- (is_admin() OR org-scope)` — jamais migrée, oubliée par tous les sweeps
-- précédents (PTBA/WBS/Logframe le 22/08, Budget/Financement/Décaissements
-- le 26/08, PPM marchés/étapes le 29/08 — aucun ne couvrait ce module).
--
-- Même bug, même correctif : un SUPER_ADMIN échoue sur la première moitié
-- du AND (son rôle littéral n'est jamais dans la liste COORDINATEUR/
-- CHARGE_PROGRAMME/ADMIN), donc la branche is_admin() de l'OR interne n'est
-- jamais atteinte — SUPER_ADMIN ne pouvait créer/modifier aucun risque en
-- écriture directe (RLS), alors que l'intention est qu'il opère sans
-- restriction.
--
-- Sans impact pratique aujourd'hui : les écritures passent exclusivement par
-- les Edge Functions (client service_role, qui bypass RLS, avec leur propre
-- requireRole() incluant déjà SUPER_ADMIN) — ce correctif comble un filet de
-- sécurité, pas un blocage observé en production.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS risques_insert ON public.risques;
CREATE POLICY risques_insert ON public.risques
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS risques_update ON public.risques;
CREATE POLICY risques_update ON public.risques
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );
