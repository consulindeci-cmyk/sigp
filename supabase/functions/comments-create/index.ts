import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

interface CreateCommentBody {
  projectId: string;
  module: string;
  elementId: string;
  elementNom?: string;
  message: string;
  statut?: string;
  priorite?: string;
  parentId?: string;
  pieceJointe?: string;
  mention?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);

    const body: CreateCommentBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.module) return json({ error: 'module est obligatoire' }, 400);
    if (!body.elementId) return json({ error: 'elementId est obligatoire' }, 400);
    if (!body.message?.trim()) return json({ error: 'message est obligatoire' }, 400);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: comment, error: insertError } = await admin
      .from('project_comments')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        module: body.module,
        element_id: body.elementId,
        element_nom: body.elementNom ?? '',
        auteur_id: profile.id,
        message: body.message.trim(),
        statut: body.statut ?? 'OUVERT',
        priorite: body.priorite ?? 'NORMALE',
        parent_id: body.parentId ?? null,
        piece_jointe: body.pieceJointe ?? null,
        mention: body.mention ?? null,
        lu: false,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select('*, auteur:users!auteur_id(nom, prenom, role)')
      .single();

    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'project_comments',
      enregistrement_id: comment.id,
      apres: comment,
    });

    return json({ data: comment }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[comments-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
