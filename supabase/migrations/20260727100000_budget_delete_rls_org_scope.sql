-- ═══════════════════════════════════════════════════════════════════════════
-- BUDGET — verrouillage multi-tenant des policies DELETE + fix cascade RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- budget_versions_delete, budget_lignes_delete, funding_sources_delete et
-- disbursements_delete n'avaient AUCUNE clause d'organisation (contrairement à
-- SELECT/UPDATE sur ces mêmes tables, toutes sous la forme `is_admin() OR X =
-- current_user_organisation_id()`) : un ADMIN (org-scopé) pouvait, via un
-- appel direct à l'API REST (hors Edge Function), soft-supprimer les lignes/
-- versions/financements/décaissements d'une AUTRE organisation. Même constat
-- et même correctif que sur logframe_objectives_delete / ptba_activites_delete
-- / wbs_nodes_delete.

DROP POLICY IF EXISTS budget_versions_delete ON public.budget_versions;
CREATE POLICY budget_versions_delete ON public.budget_versions
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS budget_lignes_delete ON public.budget_lignes;
CREATE POLICY budget_lignes_delete ON public.budget_lignes
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR budget_version_organisation_id(version_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS funding_sources_delete ON public.funding_sources;
CREATE POLICY funding_sources_delete ON public.funding_sources
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS disbursements_delete ON public.disbursements;
CREATE POLICY disbursements_delete ON public.disbursements
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR disbursement_organisation_id(id) = current_user_organisation_id())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix cascade RLS : budget_version_organisation_id() ignorait le deleted_at de
-- la version elle-même. Combiné à l'absence de cascade dans budget-versions-
-- delete (corrigée séparément côté Edge Function), des lignes restaient
-- pleinement visibles/inscriptibles sous une version "supprimée". Désormais,
-- une version soft-supprimée résout une organisation NULL, ce qui bloque
-- (is_admin() OR NULL = ... → NULL/false) SELECT/INSERT/UPDATE/DELETE sur ses
-- lignes pour tout non-SUPER_ADMIN, en défense en profondeur de la cascade.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.budget_version_organisation_id(p_version_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(bv.project_id)
  FROM public.budget_versions bv
  WHERE bv.id = p_version_id
    AND bv.deleted_at IS NULL;
$$;
