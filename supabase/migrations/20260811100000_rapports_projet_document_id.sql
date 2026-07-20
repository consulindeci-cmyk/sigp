-- ═══════════════════════════════════════════════════════════════════════════
-- Vrai moteur de génération de rapports — lien vers le fichier réel stocké
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat de l'audit Documents & Rapports : rapports_projet n'avait aucune
-- colonne de fichier — une ligne de catalogue sans le moindre lien vers
-- Supabase Storage, documents_projet ou uploads. Le bouton "Télécharger" de
-- l'historique ne pouvait STRUCTURELLEMENT rien télécharger, quel que soit
-- l'état du code frontend.
--
-- document_id référence le documents_projet créé par documents-upload-version
-- lors de la génération réelle (cf. reports-create/update, ReportGenerationSheet.tsx)
-- — permet à ReportsPage.tsx d'appeler documents-download-version pour
-- obtenir une URL signée du fichier réellement généré et stocké.
-- Nullable : les lignes créées avant ce chantier (catalogue sans fichier
-- réel) restent valides, simplement non téléchargeables tant qu'elles
-- n'ont pas été régénérées.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.rapports_projet
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents_projet(id);

NOTIFY pgrst, 'reload schema';
