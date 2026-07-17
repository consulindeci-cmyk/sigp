import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

const BUCKET = 'sigp-documents';
const SIGNED_URL_TTL_SECONDS = 60;

interface DownloadVersionBody {
  documentId: string;
  versionNumber?: number; // omis = dernière version
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Lecture ouverte aux mêmes 6 rôles que la lecture des documents (pas de
    // requireRole ici — VIEWER/FINANCIER/AUDITEUR etc. peuvent télécharger).

    const body: DownloadVersionBody = await req.json();
    if (!body.documentId) return json({ error: 'documentId est obligatoire' }, 400);

    const { data: document, error: docError } = await admin
      .from('documents_projet')
      .select('id, project_id')
      .eq('id', body.documentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (docError) throw docError;
    if (!document) return json({ error: 'Document introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: document.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce document n'appartient pas à votre organisation" }, 403);
      }
    }

    let versionQuery = admin
      .from('document_projet_versions')
      .select('id, numero_version, upload_id')
      .eq('document_id', body.documentId);

    versionQuery = body.versionNumber
      ? versionQuery.eq('numero_version', body.versionNumber)
      : versionQuery.order('numero_version', { ascending: false }).limit(1);

    const { data: version, error: versionError } = await versionQuery.maybeSingle();
    if (versionError) throw versionError;
    if (!version) return json({ error: 'Aucun fichier/version associé à ce document' }, 404);

    const { data: upload, error: uploadError } = await admin
      .from('uploads')
      .select('original_name, mime_type, key, bucket')
      .eq('id', version.upload_id)
      .maybeSingle();
    if (uploadError) throw uploadError;
    if (!upload) return json({ error: 'Fichier introuvable dans le stockage' }, 404);

    const { data: signed, error: signError } = await admin.storage
      .from(upload.bucket || BUCKET)
      .createSignedUrl(upload.key, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed) {
      return json({ error: `Impossible de générer le lien de téléchargement : ${signError?.message}` }, 500);
    }

    return json({
      data: {
        url: signed.signedUrl,
        originalName: upload.original_name,
        mimeType: upload.mime_type,
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[documents-download-version]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
