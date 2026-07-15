-- ═══════════════════════════════════════════════════════════════════════════
-- Module Rapports (useReports.ts) — la lecture était déjà couverte par une
-- policy SELECT (ajoutée lors du module Dashboard, pour compter rapportsTotal),
-- mais aucune Edge Function d'écriture n'a jamais été construite pour ce
-- module. Ajout des policies INSERT/UPDATE/DELETE manquantes.
--
-- Même correction que partout ailleurs : ReportController NestJS est
-- @ApiAuth(ADMIN) sur toute la classe (y compris la lecture, déjà corrigée
-- lors du Dashboard) — écriture ouverte à COORDINATEUR/CHARGE_PROGRAMME/ADMIN,
-- suppression réservée à ADMIN, cohérent avec Documents/Livrables/Contrats/etc.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS rapports_projet_insert ON public.rapports_projet;
CREATE POLICY rapports_projet_insert ON public.rapports_projet
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS rapports_projet_update ON public.rapports_projet;
CREATE POLICY rapports_projet_update ON public.rapports_projet
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS rapports_projet_delete ON public.rapports_projet;
CREATE POLICY rapports_projet_delete ON public.rapports_projet
  FOR DELETE USING (current_user_role() = 'ADMIN');
