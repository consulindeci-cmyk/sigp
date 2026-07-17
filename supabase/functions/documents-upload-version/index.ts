import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  extractExtension,
  sha256Hex,
} from '../_shared/upload-rules.ts';

const BUCKET = 'sigp-documents';

interface UploadVersionBody {
  documentId: string;
  fileName: string;
  mimeType: string;
  fileBase64: string; // fichier encodé en base64 (sans préfixe data:...;base64,)
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UploadVersionBody = await req.json();
    if (!body.documentId) return json({ error: 'documentId est obligatoire' }, 400);
    if (!body.fileName || !body.fileBase64) {
      return json({ error: 'Aucun fichier fourni pour le téléversement.' }, 400);
    }

    const { data: document, error: docError } = await admin
      .from('documents_projet')
      .select('id, project_id')
      .eq('id', body.documentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (docError) throw docError;
    if (!document) return json({ error: 'Document introuvable' }, 404);

    // Résolu inconditionnellement (pas seulement pour le contrôle d'accès
    // non-SUPER_ADMIN) : sert aussi de préfixe de chemin de stockage ci-dessous.
    const { data: documentOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
      p_project_id: document.project_id,
    });
    if (orgError) throw orgError;

    if (profile.role !== 'SUPER_ADMIN') {
      if (!documentOrgId || documentOrgId !== profile.organisation_id) {
        return json({ error: "Ce document n'appartient pas à votre organisation" }, 403);
      }
    }

    const ext = extractExtension(body.fileName);
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(body.mimeType)) {
      return json(
        {
          error:
            "Le type ou l'extension du fichier n'est pas autorisé. Extensions admises : PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, PNG, JPG, JPEG, ZIP.",
        },
        400,
      );
    }

    const bytes = Uint8Array.from(atob(body.fileBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
      return json(
        {
          error: `Le fichier dépasse la taille maximale autorisée (25 Mo). Taille actuelle : ${(bytes.byteLength / (1024 * 1024)).toFixed(2)} Mo.`,
        },
        400,
      );
    }

    // Nouveaux uploads uniquement : chemin préfixé par organisation
    // (attachments/{organisation_id}/...) — les fichiers déjà en place restent
    // à leur ancienne clé plate, aucune bascule rétroactive n'est effectuée.
    // "unassigned" : filet de sécurité pour un projet orphelin sans programme
    // (documentOrgId alors NULL), cas déjà documenté ailleurs dans le schéma.
    const storedName = `attachments/${documentOrgId ?? 'unassigned'}/${crypto.randomUUID()}${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storedName, bytes, { contentType: body.mimeType, upsert: false });
    if (uploadError) {
      return json({ error: `Échec du téléversement vers le stockage : ${uploadError.message}` }, 400);
    }

    const sha256 = await sha256Hex(bytes);

    const { data: upload, error: uploadRowError } = await admin
      .from('uploads')
      .insert({
        id: crypto.randomUUID(),
        original_name: body.fileName.slice(0, 500),
        stored_name: storedName.slice(0, 500),
        mime_type: body.mimeType.slice(0, 100),
        size_bytes: bytes.byteLength,
        sha256,
        bucket: BUCKET,
        key: storedName.slice(0, 500),
        uploaded_by: profile.id,
      })
      .select()
      .single();
    if (uploadRowError) throw uploadRowError;

    const { data: latest } = await admin
      .from('document_projet_versions')
      .select('numero_version')
      .eq('document_id', body.documentId)
      .order('numero_version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const numeroVersion = (latest?.numero_version ?? 0) + 1;

    const { data: version, error: versionError } = await admin
      .from('document_projet_versions')
      .insert({
        id: crypto.randomUUID(),
        document_id: body.documentId,
        numero_version: numeroVersion,
        upload_id: upload.id,
        notes: body.notes ?? null,
        created_by: profile.id,
      })
      .select()
      .single();
    if (versionError) throw versionError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: document.project_id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'document_projet_versions',
      enregistrement_id: version.id,
      apres: { version, upload },
    });

    return json({ data: { version, upload } }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[documents-upload-version]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
