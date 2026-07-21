-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — INSERT/UPDATE/DELETE sur 6 tables du périmètre "Paramètres
-- du Projet" incompatibles SUPER_ADMIN, et DELETE sans cloisonnement
-- organisationnel
-- ═══════════════════════════════════════════════════════════════════════════
-- Même piège que celui déjà corrigé sur documents_projet, rapports_projet,
-- livrables, risques, etc. cette session :
-- - INSERT/UPDATE testaient `current_user_role() IN (...) AND (is_admin() OR
--   org-scope)` — avec is_admin() qui teste role = 'SUPER_ADMIN', un
--   SUPER_ADMIN échoue déjà sur le premier IN(...), donc la branche
--   is_admin() de l'OR interne n'est jamais atteinte.
-- - DELETE était pire : `current_user_role() = 'ADMIN'` seul, sans AUCUN
--   cloisonnement par organisation — un ADMIN d'une organisation pouvait
--   agir sur les lignes de n'importe quelle autre organisation via un appel
--   REST direct (hors Edge Function, qui fait bien ce contrôle côté serveur
--   mais n'est pas la seule porte d'entrée possible).
--
-- Corrigé avec la forme validée : is_admin() OR (rôle autorisé AND org-scope).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── projects ──────────────────────────────────────────────────────────────
-- Cas particulier : à l'INSERT, le projet n'a pas encore d'id — le
-- cloisonnement organisationnel passe par programme_organisation_id(programme_id),
-- pas project_organisation_id(id), exactement comme la policy d'origine.

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'ADMIN')
      AND programme_organisation_id(programme_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'ADMIN')
      AND project_organisation_id(id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(id) = current_user_organisation_id()
    )
  );

-- ── project_settings ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS project_settings_insert ON public.project_settings;
CREATE POLICY project_settings_insert ON public.project_settings
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_settings_update ON public.project_settings;
CREATE POLICY project_settings_update ON public.project_settings
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_settings_delete ON public.project_settings;
CREATE POLICY project_settings_delete ON public.project_settings
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ── project_team_members ──────────────────────────────────────────────────

DROP POLICY IF EXISTS project_team_members_insert ON public.project_team_members;
CREATE POLICY project_team_members_insert ON public.project_team_members
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_team_members_update ON public.project_team_members;
CREATE POLICY project_team_members_update ON public.project_team_members
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_team_members_delete ON public.project_team_members;
CREATE POLICY project_team_members_delete ON public.project_team_members
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ── project_committee_members ─────────────────────────────────────────────

DROP POLICY IF EXISTS project_committee_members_insert ON public.project_committee_members;
CREATE POLICY project_committee_members_insert ON public.project_committee_members
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_committee_members_update ON public.project_committee_members;
CREATE POLICY project_committee_members_update ON public.project_committee_members
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_committee_members_delete ON public.project_committee_members;
CREATE POLICY project_committee_members_delete ON public.project_committee_members
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ── project_stakeholders ──────────────────────────────────────────────────

DROP POLICY IF EXISTS project_stakeholders_insert ON public.project_stakeholders;
CREATE POLICY project_stakeholders_insert ON public.project_stakeholders
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_stakeholders_update ON public.project_stakeholders;
CREATE POLICY project_stakeholders_update ON public.project_stakeholders
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_stakeholders_delete ON public.project_stakeholders;
CREATE POLICY project_stakeholders_delete ON public.project_stakeholders
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

-- ── project_contacts ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS project_contacts_insert ON public.project_contacts;
CREATE POLICY project_contacts_insert ON public.project_contacts
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_contacts_update ON public.project_contacts;
CREATE POLICY project_contacts_update ON public.project_contacts
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS project_contacts_delete ON public.project_contacts;
CREATE POLICY project_contacts_delete ON public.project_contacts
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );
