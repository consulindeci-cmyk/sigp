-- ═══════════════════════════════════════════════════════════════════════════
-- Dashboard (dernier module) — RLS lecture seule sur les 2 tables jamais
-- migrées mais nécessaires à l'agrégation : evm_snapshots et rapports_projet.
-- ═══════════════════════════════════════════════════════════════════════════
-- Les deux ont project_id en colonne directe → réutilisent project_organisation_id()
-- sans nouveau helper. AUCUNE policy INSERT/UPDATE/DELETE ici : les modules
-- EVM et Reports complets (CRUD) restent un chantier séparé, non requis pour
-- que le Dashboard (lecture seule) fonctionne.

ALTER TABLE public.evm_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evm_snapshots_select ON public.evm_snapshots;
CREATE POLICY evm_snapshots_select ON public.evm_snapshots
  FOR SELECT USING (
    is_admin() OR project_organisation_id(project_id) = current_user_organisation_id()
  );

ALTER TABLE public.rapports_projet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rapports_projet_select ON public.rapports_projet;
CREATE POLICY rapports_projet_select ON public.rapports_projet
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
