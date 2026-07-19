-- ═══════════════════════════════════════════════════════════════════════════
-- SOURCES DE FINANCEMENT — angle mort résiduel du fix budget_version_organisation_id()
-- ═══════════════════════════════════════════════════════════════════════════
-- Le correctif du 20260727100000 n'a filtré deleted_at que sur
-- budget_version_organisation_id(). Les deux autres fonctions du même trio
-- SECURITY DEFINER, utilisées par disbursement_organisation_id() pour
-- résoudre l'organisation d'un décaissement, avaient le même angle mort :
-- un décaissement rattaché à une funding_source ou une budget_ligne
-- soft-supprimée restait pleinement visible/inscriptible via RLS (pas de
-- fuite inter-organisation, mais une étanchéité logique incomplète —
-- cf. audit Sources de Financement).

CREATE OR REPLACE FUNCTION public.funding_source_organisation_id(p_funding_source_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(fs.project_id)
  FROM public.funding_sources fs
  WHERE fs.id = p_funding_source_id
    AND fs.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.budget_line_organisation_id(p_line_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT budget_version_organisation_id(bl.version_id)
  FROM public.budget_lignes bl
  WHERE bl.id = p_line_id
    AND bl.deleted_at IS NULL;
$$;
