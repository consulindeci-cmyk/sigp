-- ═══════════════════════════════════════════════════════════════════════════
-- Suppression définitive des modules Livrables, Documents, Rapports,
-- Commentaires (code frontend + Edge Functions déjà retirés dans le même
-- chantier) — décision explicitement confirmée par l'utilisateur après audit
-- des dépendances croisées (page globale /documents partageant
-- documents_projet, widget Jalons et compteurs Dashboard rebasés sur PTBA,
-- section Archivage/Export de SettingsPage limitée aux projets, bouton
-- "Rapport rapide" retiré de ProjectHeader.tsx).
--
-- ⚠️ IRRÉVERSIBLE — à exécuter UNIQUEMENT après avoir sauvegardé/exporté ces
-- 4 tables (CSV ou export JSON) depuis le Dashboard Supabase. Cette migration
-- n'a jamais été exécutée ni testée sur une base réelle (aucun accès direct
-- à Postgres dans l'environnement où elle a été écrite).
--
-- CASCADE supprime automatiquement les policies RLS et triggers rattachés à
-- chaque table — pas besoin de DROP POLICY séparé.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.livrables CASCADE;
DROP TABLE IF EXISTS public.documents_projet CASCADE;
DROP TABLE IF EXISTS public.rapports_projet CASCADE;
DROP TABLE IF EXISTS public.project_comments CASCADE;
