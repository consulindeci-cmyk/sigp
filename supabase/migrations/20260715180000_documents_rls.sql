-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module Documents (métadonnées)
-- ═══════════════════════════════════════════════════════════════════════════
-- Portée de cette passe : documents_projet (métadonnées) uniquement.
-- La gestion des versions/uploads (Supabase Storage) est traitée séparément
-- une fois cette base validée — voir note de suivi dans la mémoire projet.
--
-- Différence assumée avec Risques/WBS/Contrats : ici la suppression NestJS
-- est réellement COORDINATEUR + ADMIN (pas ADMIN seul) — vérifié dans
-- document.controller.ts ligne 132, reproduit fidèlement (pas une déviation
-- volontaire cette fois, c'est la vraie règle existante).

ALTER TABLE public.documents_projet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_projet_select ON public.documents_projet;
CREATE POLICY documents_projet_select ON public.documents_projet
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS documents_projet_insert ON public.documents_projet;
CREATE POLICY documents_projet_insert ON public.documents_projet
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS documents_projet_update ON public.documents_projet;
CREATE POLICY documents_projet_update ON public.documents_projet
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS documents_projet_delete ON public.documents_projet;
CREATE POLICY documents_projet_delete ON public.documents_projet
  FOR DELETE USING (current_user_role() IN ('COORDINATEUR', 'ADMIN'));
