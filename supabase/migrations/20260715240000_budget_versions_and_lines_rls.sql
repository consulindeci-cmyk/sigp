-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, chantier Budget (1/5) :
-- budget_versions + budget_lignes
-- ═══════════════════════════════════════════════════════════════════════════
-- Deux tables traitées ensemble : une ligne n'a de sens que rattachée à une
-- version (version_id NOT NULL, FK ON DELETE CASCADE). Les traiter séparément
-- créerait une dépendance artificielle entre deux tours de validation.
--
-- Écart assumé par rapport au pattern Risques/WBS/Contrats/Documents/Livrables :
-- FINANCIER est ajouté aux rôles d'écriture (create/update), en plus de
-- COORDINATEUR/CHARGE_PROGRAMME/ADMIN — la gestion budgétaire est le cœur du
-- rôle FINANCIER, contrairement aux modules précédents où il n'avait pas de
-- raison métier d'écrire. Suppression toujours réservée à ADMIN.

CREATE OR REPLACE FUNCTION public.budget_version_organisation_id(p_version_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(bv.project_id)
  FROM public.budget_versions bv
  WHERE bv.id = p_version_id;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- budget_versions
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_versions_select ON public.budget_versions;
CREATE POLICY budget_versions_select ON public.budget_versions
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_versions_insert ON public.budget_versions;
CREATE POLICY budget_versions_insert ON public.budget_versions
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_versions_update ON public.budget_versions;
CREATE POLICY budget_versions_update ON public.budget_versions
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_versions_delete ON public.budget_versions;
CREATE POLICY budget_versions_delete ON public.budget_versions
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────────
-- budget_lignes
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.budget_lignes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_lignes_select ON public.budget_lignes;
CREATE POLICY budget_lignes_select ON public.budget_lignes
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR budget_version_organisation_id(version_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_lignes_insert ON public.budget_lignes;
CREATE POLICY budget_lignes_insert ON public.budget_lignes
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR budget_version_organisation_id(version_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_lignes_update ON public.budget_lignes;
CREATE POLICY budget_lignes_update ON public.budget_lignes
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR budget_version_organisation_id(version_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_lignes_delete ON public.budget_lignes;
CREATE POLICY budget_lignes_delete ON public.budget_lignes
  FOR DELETE USING (current_user_role() = 'ADMIN');
