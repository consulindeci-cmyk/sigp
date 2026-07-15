-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, chantier Budget (3/5 et 4/5) :
-- funding_sources + disbursements
-- ═══════════════════════════════════════════════════════════════════════════
-- Traités ensemble car DisbursementService.validateRelations() croise déjà
-- funding_sources et budget_versions/budget_lignes en une seule logique de
-- cohérence — les séparer aurait dupliqué le travail sur les deux passes.
--
-- Complexité notable trouvée dans le schéma : `disbursements` N'A PAS de
-- project_id direct. Il ne référence, tous facultatifs (nullable), que
-- budget_version_id, budget_ligne_id, contract_id, funding_source_id.
-- L'organisation doit donc être résolue via le PREMIER de ces 4 chemins
-- disponible (COALESCE) — un décaissement sans aucune de ces références
-- n'est visible que par ADMIN, par cohérence avec le traitement des
-- entités orphelines déjà appliqué sur Projects.

-- ───────────────────────────────────────────────────────────────────────────
-- Fonctions helper
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.budget_line_organisation_id(p_line_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT budget_version_organisation_id(bl.version_id)
  FROM public.budget_lignes bl
  WHERE bl.id = p_line_id;
$$;

CREATE OR REPLACE FUNCTION public.funding_source_organisation_id(p_funding_source_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(fs.project_id)
  FROM public.funding_sources fs
  WHERE fs.id = p_funding_source_id;
$$;

CREATE OR REPLACE FUNCTION public.disbursement_organisation_id(p_disbursement_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    budget_version_organisation_id(d.budget_version_id),
    budget_line_organisation_id(d.budget_ligne_id),
    project_organisation_id(c.project_id),
    funding_source_organisation_id(d.funding_source_id)
  )
  FROM public.disbursements d
  LEFT JOIN public.contracts c ON c.id = d.contract_id
  WHERE d.id = p_disbursement_id;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- funding_sources — même pattern que budget_versions/budget_lignes
-- (FINANCIER inclus en écriture, gestion financière = son rôle métier)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funding_sources_select ON public.funding_sources;
CREATE POLICY funding_sources_select ON public.funding_sources
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS funding_sources_insert ON public.funding_sources;
CREATE POLICY funding_sources_insert ON public.funding_sources
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS funding_sources_update ON public.funding_sources;
CREATE POLICY funding_sources_update ON public.funding_sources
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS funding_sources_delete ON public.funding_sources;
CREATE POLICY funding_sources_delete ON public.funding_sources
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────────
-- disbursements — org résolue via disbursement_organisation_id() (COALESCE
-- des 4 chemins possibles)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS disbursements_select ON public.disbursements;
CREATE POLICY disbursements_select ON public.disbursements
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR disbursement_organisation_id(id) = current_user_organisation_id())
  );

-- INSERT : la ligne n'existe pas encore au moment du WITH CHECK, donc pas de
-- disbursement_organisation_id(id) possible ici — l'Edge Function fait la
-- vérification complète en amont (comme pour projects_insert). Ce filet ne
-- fait que restreindre le rôle.
DROP POLICY IF EXISTS disbursements_insert ON public.disbursements;
CREATE POLICY disbursements_insert ON public.disbursements
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
  );

DROP POLICY IF EXISTS disbursements_update ON public.disbursements;
CREATE POLICY disbursements_update ON public.disbursements
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN')
    AND (is_admin() OR disbursement_organisation_id(id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS disbursements_delete ON public.disbursements;
CREATE POLICY disbursements_delete ON public.disbursements
  FOR DELETE USING (current_user_role() = 'ADMIN');
