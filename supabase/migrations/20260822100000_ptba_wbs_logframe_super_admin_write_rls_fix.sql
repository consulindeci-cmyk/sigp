-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — SUPER_ADMIN exclu par erreur des policies INSERT/UPDATE/
-- DELETE de ptba_activites, wbs_nodes, logframe_objectives, logframe_indicators
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (audit PTBA) : ces 4 tables utilisaient encore la forme d'origine
-- `current_user_role() IN (...) AND (is_admin() OR org-scope)` sur leurs
-- policies d'écriture (INSERT/UPDATE : rôles COORDINATEUR/CHARGE_PROGRAMME/
-- ADMIN ; DELETE : ADMIN seul). Depuis la bascule multi-tenant, is_admin()
-- teste role = 'SUPER_ADMIN' — avec cette composition, un SUPER_ADMIN échoue
-- déjà sur le premier AND (son rôle littéral n'est jamais dans la liste),
-- donc la branche is_admin() de l'OR interne n'est jamais atteinte :
-- SUPER_ADMIN ne pouvait écrire/supprimer AUCUNE ligne sur ces 4 tables, alors
-- que l'intention (cf. is_admin() partout ailleurs dans l'app) est qu'il
-- opère sans restriction.
--
-- Même bug, même correctif que 20260808100000_fix_super_admin_delete_rls_7_tables
-- (qui couvrait budget_versions/budget_lignes/funding_sources/disbursements/
-- ppm_marches/ppm_etapes/contracts, mais pas encore ces 4 tables) — étendu ici
-- aux policies INSERT/UPDATE en plus de DELETE, qui avaient le même défaut.
--
-- Forme corrigée : `is_admin() OR (rôle(s) autorisé(s) AND org-scope)` —
-- SUPER_ADMIN passe sans condition, les autres rôles restent strictement
-- cloisonnés à leur organisation. Aucun changement de comportement pour
-- COORDINATEUR/CHARGE_PROGRAMME/ADMIN (le cloisonnement organisationnel
-- introduit par les migrations précédentes est préservé à l'identique).
--
-- Les policies SELECT des 4 tables utilisaient déjà la forme correcte
-- (`is_admin() OR org-scope` en tête) — non modifiées ici.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ptba_activites
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ptba_activites_insert ON public.ptba_activites;
CREATE POLICY ptba_activites_insert ON public.ptba_activites
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS ptba_activites_update ON public.ptba_activites;
CREATE POLICY ptba_activites_update ON public.ptba_activites
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS ptba_activites_delete ON public.ptba_activites;
CREATE POLICY ptba_activites_delete ON public.ptba_activites
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

-- ───────────────────────────────────────────────────────────────────────────
-- wbs_nodes
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS wbs_nodes_insert ON public.wbs_nodes;
CREATE POLICY wbs_nodes_insert ON public.wbs_nodes
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS wbs_nodes_update ON public.wbs_nodes;
CREATE POLICY wbs_nodes_update ON public.wbs_nodes
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS wbs_nodes_delete ON public.wbs_nodes;
CREATE POLICY wbs_nodes_delete ON public.wbs_nodes
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

-- ───────────────────────────────────────────────────────────────────────────
-- logframe_objectives
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS logframe_objectives_insert ON public.logframe_objectives;
CREATE POLICY logframe_objectives_insert ON public.logframe_objectives
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS logframe_objectives_update ON public.logframe_objectives;
CREATE POLICY logframe_objectives_update ON public.logframe_objectives
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS logframe_objectives_delete ON public.logframe_objectives;
CREATE POLICY logframe_objectives_delete ON public.logframe_objectives
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

-- ───────────────────────────────────────────────────────────────────────────
-- logframe_indicators (org-scope via logframe_objective_organisation_id())
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS logframe_indicators_insert ON public.logframe_indicators;
CREATE POLICY logframe_indicators_insert ON public.logframe_indicators
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND logframe_objective_organisation_id(objective_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS logframe_indicators_update ON public.logframe_indicators;
CREATE POLICY logframe_indicators_update ON public.logframe_indicators
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND logframe_objective_organisation_id(objective_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS logframe_indicators_delete ON public.logframe_indicators;
CREATE POLICY logframe_indicators_delete ON public.logframe_indicators
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND logframe_objective_organisation_id(objective_id) = current_user_organisation_id())
  );
