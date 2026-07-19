-- ═══════════════════════════════════════════════════════════════════════════
-- MARCHÉS & CONTRATS — verrouillage multi-tenant des policies DELETE + fix
-- deleted_at sur ppm_marche_organisation_id()
-- ═══════════════════════════════════════════════════════════════════════════
-- ppm_marches_delete, ppm_etapes_delete et contracts_delete n'avaient aucune
-- clause d'organisation (contrairement à SELECT/INSERT/UPDATE, toutes sous la
-- forme `is_admin() OR X = current_user_organisation_id()`) : un ADMIN
-- (org-scopé) pouvait, via un appel direct à l'API REST (hors Edge Function),
-- soft-supprimer (ou, pour ppm_etapes, supprimer définitivement — cette table
-- n'a pas de deleted_at) les marchés/étapes/contrats d'une AUTRE organisation.
-- Même constat et même correctif que sur Budget/Financements.

DROP POLICY IF EXISTS ppm_marches_delete ON public.ppm_marches;
CREATE POLICY ppm_marches_delete ON public.ppm_marches
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_etapes_delete ON public.ppm_etapes;
CREATE POLICY ppm_etapes_delete ON public.ppm_etapes
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS contracts_delete ON public.contracts;
CREATE POLICY contracts_delete ON public.contracts
  FOR DELETE USING (
    current_user_role() = 'ADMIN'
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix angle mort : ppm_marche_organisation_id() ignorait le deleted_at du
-- marché lui-même — un marché soft-supprimé restait résolvable en
-- organisation, laissant ses ppm_etapes pleinement visibles/inscriptibles.
-- Même correctif déjà appliqué à budget_version_organisation_id() et
-- funding_source_organisation_id().
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ppm_marche_organisation_id(p_marche_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(pm.project_id)
  FROM public.ppm_marches pm
  WHERE pm.id = p_marche_id
    AND pm.deleted_at IS NULL;
$$;
