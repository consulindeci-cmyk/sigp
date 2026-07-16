-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECTIF — FK manquante document_projet_versions.upload_id → uploads.id
-- ═══════════════════════════════════════════════════════════════════════════
-- Trou du schéma Prisma d'origine : DocumentProjetVersion.upload_id n'a jamais
-- eu de @relation déclarée (contrairement à document_id, qui a bien sa FK).
-- Sans cette contrainte, PostgREST ne peut pas résoudre l'embedding
-- `uploads(...)` utilisé par useDocumentVersionsSupabase() — d'où l'erreur
-- "Could not find a relationship between 'document_projet_versions' and
-- 'uploads' in the schema cache".
--
-- Vérifié avant application : 0 ligne orpheline (tous les upload_id existants
-- référencent bien un upload réel) — l'ajout de la contrainte est sans risque
-- sur les données actuelles.

DO $$ BEGIN
  ALTER TABLE public.document_projet_versions
    ADD CONSTRAINT document_projet_versions_upload_id_fkey
    FOREIGN KEY (upload_id) REFERENCES public.uploads(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Force PostgREST à recharger son cache de schéma immédiatement (sinon il
-- peut mettre plusieurs minutes à détecter la nouvelle relation tout seul).
NOTIFY pgrst, 'reload schema';
