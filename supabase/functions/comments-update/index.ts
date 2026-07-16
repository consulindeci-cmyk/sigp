import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

interface UpdateCommentBody {
  id: string;
  message?: string;
  statut?: string;
  priorite?: string;
  pieceJointe?: string;
  mention?: string;
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

    if (profile.role !== 'ADMIN' && existing.auteur_id !== profile.id) {
      return json({ error: "Accès refusé : seul l'auteur ou un administrateur peut modifier ce commentaire" }, 403);
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.message !== undefined) updatePayload.message = body.message.trim();
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.priorite !== undefined) updatePayload.priorite = body.priorite;
    if (body.pieceJointe !== undefined) updatePayload.piece_jointe = body.pieceJointe;
    if (body.mention !== undefined) updatePayload.mention = body.mention;
    if (body.lu !== undefined) updatePayload.lu = body.lu;

    const { data: updated, error: updateError } = await admin
      .from('project_comments')
      .update(updatePayload)
      .eq('id', body.id)
      .select('*, auteur:users!auteur_id(nom, prenom, role)')
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
