-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Phase 2, module Documents (versions + upload)
-- ═══════════════════════════════════════════════════════════════════════════
-- Complète le module Documents : gestion des versions (document_projet_versions)
-- et des fichiers uploadés (uploads), stockés sur Supabase Storage.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Bucket Storage privé pour les fichiers de documents
-- ───────────────────────────────────────────────────────────────────────────
-- Privé (public=false) : tout accès passe par l'Edge Function (service_role),
-- jamais directement depuis le frontend. Limite et types alignés sur
-- UploadsService (NestJS) : 25 Mo, mêmes types MIME autorisés.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sigp-documents',
  'sigp-documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Fonctions helper pour remonter à l'organisation depuis une version/upload
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.document_organisation_id(p_document_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(d.project_id)
  FROM public.documents_projet d
  WHERE d.id = p_document_id;
$$;

CREATE OR REPLACE FUNCTION public.upload_organisation_id(p_upload_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT document_organisation_id(dpv.document_id)
  FROM public.document_projet_versions dpv
  WHERE dpv.upload_id = p_upload_id
  LIMIT 1;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RLS — document_projet_versions et uploads (lecture seule ; écriture
--    exclusivement via l'Edge Function documents-upload-version, service_role)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.document_projet_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_projet_versions_select ON public.document_projet_versions;
CREATE POLICY document_projet_versions_select ON public.document_projet_versions
  FOR SELECT USING (
    is_admin() OR document_organisation_id(document_id) = current_user_organisation_id()
  );

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS uploads_select ON public.uploads;
CREATE POLICY uploads_select ON public.uploads
  FOR SELECT USING (
    is_admin() OR upload_organisation_id(id) = current_user_organisation_id()
  );
