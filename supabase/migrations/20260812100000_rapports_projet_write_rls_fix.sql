-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — INSERT/UPDATE/DELETE sur rapports_projet incompatibles
-- SUPER_ADMIN, et DELETE sans cloisonnement organisationnel
-- ═══════════════════════════════════════════════════════════════════════════
-- Même piège que celui déjà corrigé sur 11+ tables cette session (documents_
-- projet, livrables, risques, budget_versions, contracts, etc.) — jamais
-- appliqué à rapports_projet (20260715440000_reports_write_rls.sql) :
--
-- INSERT/UPDATE testaient `current_user_role() IN (...) AND (is_admin() OR
-- org-scope)` — avec is_admin() qui teste role = 'SUPER_ADMIN', un SUPER_ADMIN
-- échoue déjà sur le premier IN(...), donc la branche is_admin() de l'OR
-- interne n'est jamais atteinte.
--
-- DELETE était pire : `current_user_role() = 'ADMIN'` seul, sans AUCUN
-- cloisonnement par organisation — un ADMIN d'une organisation pouvait
-- supprimer les rapports de n'importe quelle autre organisation via un appel
-- REST direct (hors Edge Function reports-delete, qui fait bien ce contrôle
-- côté serveur mais n'est pas la seule porte d'entrée possible).
--
-- Corrigé avec la forme validée : is_admin() OR (rôle autorisé AND org-scope).
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS rapports_projet_insert ON public.rapports_projet;
CREATE POLICY rapports_projet_insert ON public.rapports_projet
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS rapports_projet_update ON public.rapports_projet;
CREATE POLICY rapports_projet_update ON public.rapports_projet
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS rapports_projet_delete ON public.rapports_projet;
CREATE POLICY rapports_projet_delete ON public.rapports_projet
  FOR DELETE USING (
    is_admin()
    OR (
      current_user_role() = 'ADMIN'
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );
