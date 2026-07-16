import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface RestoreDocumentBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Même rôle que documents-delete (COORDINATEUR + ADMIN) — restaurer est
    // l'inverse symétrique de supprimer, pas une opération distincte.
    requireRole(profile, ['COORDINATEUR', 'ADMIN']);

    const body: RestoreDocumentBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('documents_projet')
      .select('*')
      .eq('id', body.id)
      .not('deleted_at', 'is', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: "Document introuvable dans la corbeille" }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce document n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: restored, error: restoreError } = await admin
      .from('documents_projet')
      .update({ deleted_at: null, updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select('*')
      .single();
    if (restoreError) throw restoreError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'RESTORE',
      table_cible: 'documents_projet',
      enregistrement_id: body.id,
      avant: existing,
      apres: restored,
    });

    return json({ data: restored });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[documents-restore]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
