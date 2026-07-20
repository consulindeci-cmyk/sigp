-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif RLS — INSERT/UPDATE sur documents_projet incompatibles SUPER_ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Même défaut que celui déjà corrigé sur 7+ tables cette session (dont
-- documents_projet_delete) : ces deux policies testaient
-- `current_user_role() IN (...) AND (is_admin() OR org-scope)` — avec
-- is_admin() qui teste role = 'SUPER_ADMIN', un SUPER_ADMIN échoue déjà sur
-- le premier IN(...) (son rôle littéral n'y figure pas), donc la branche
-- is_admin() de l'OR interne n'est jamais atteinte.
--
-- Corrigé avec la forme validée : is_admin() OR (rôle autorisé AND org-scope)
-- — SUPER_ADMIN passe sans condition, les rôles listés restent strictement
-- cloisonnés à leur organisation. Aucun changement de comportement pour eux.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS documents_projet_insert ON public.documents_projet;
CREATE POLICY documents_projet_insert ON public.documents_projet
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );

DROP POLICY IF EXISTS documents_projet_update ON public.documents_projet;
CREATE POLICY documents_projet_update ON public.documents_projet
  FOR UPDATE USING (
    is_admin()
    OR (
      current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );
