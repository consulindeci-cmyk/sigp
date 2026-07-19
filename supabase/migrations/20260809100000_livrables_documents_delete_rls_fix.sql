-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — DELETE sur livrables et documents_projet : cloisonnement
-- organisationnel + compatibilité SUPER_ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Même faille que celle déjà corrigée sur 9 tables cette session (risques,
-- notifications, budget_versions, budget_lignes, funding_sources,
-- disbursements, ppm_marches, ppm_etapes, contracts) : les policies DELETE de
-- livrables/documents_projet ne vérifiaient QUE current_user_role() sans
-- cloisonnement par organisation, et sans reconnaître SUPER_ADMIN.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS livrables_delete ON public.livrables;
CREATE POLICY livrables_delete ON public.livrables
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() = 'ADMIN' AND project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS documents_projet_delete ON public.documents_projet;
CREATE POLICY documents_projet_delete ON public.documents_projet
  FOR DELETE USING (
    is_admin()
    OR (current_user_role() IN ('COORDINATEUR', 'ADMIN') AND project_organisation_id(project_id) = current_user_organisation_id())
  );
