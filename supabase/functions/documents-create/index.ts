import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateDocumentBody {
  projectId: string;
  livrableId?: string;
  titre: string;
  description?: string;
  statut?: 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE' | 'ARCHIVE';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateDocumentBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.titre?.trim()) return json({ error: 'titre est obligatoire' }, 400);

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: document, error: insertError } = await admin
      .from('documents_projet')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        livrable_id: body.livrableId ?? null,
        titre: body.titre.trim(),
        description: body.description ?? null,
        statut: body.statut ?? 'BROUILLON',
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'documents_projet',
      enregistrement_id: document.id,
      apres: document,
    });

    return json({ data: document }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[documents-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
