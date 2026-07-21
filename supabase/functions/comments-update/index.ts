import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

interface UpdateCommentBody {
  id: string;
  message?: string;
  statut?: string;
  priorite?: string;
  pieceJointeDocumentId?: string | null;
  mentionUserId?: string | null;
  lu?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);

    const body: UpdateCommentBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('project_comments')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Commentaire introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN' && existing.auteur_id !== profile.id) {
      if (profile.role !== 'ADMIN') {
        return json({ error: "Accès refusé : seul l'auteur ou un administrateur peut modifier ce commentaire" }, 403);
      }
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : seul l'auteur ou un administrateur peut modifier ce commentaire" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.message !== undefined) updatePayload.message = body.message.trim();
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.priorite !== undefined) updatePayload.priorite = body.priorite;
    if (body.pieceJointeDocumentId !== undefined) updatePayload.piece_jointe_document_id = body.pieceJointeDocumentId;
    if (body.mentionUserId !== undefined) updatePayload.mention_user_id = body.mentionUserId;
    if (body.lu !== undefined) updatePayload.lu = body.lu;

    const { data: updated, error: updateError } = await admin
      .from('project_comments')
      .update(updatePayload)
      .eq('id', body.id)
      .select('*, auteur:users!auteur_id(nom, prenom, role), mention_user:users!mention_user_id(nom, prenom)')
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'project_comments',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[comments-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
