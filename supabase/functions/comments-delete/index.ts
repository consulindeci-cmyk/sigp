import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

interface DeleteCommentBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);

    const body: DeleteCommentBody = await req.json();
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
        return json({ error: "Accès refusé : seul l'auteur ou un administrateur peut supprimer ce commentaire" }, 403);
      }
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : seul l'auteur ou un administrateur peut supprimer ce commentaire" }, 403);
      }
    }

    // Supprime aussi les réponses directes (même comportement que le mock :
    // suppression en cascade logique d'un fil de discussion).
    const { error: deleteRepliesError } = await admin
      .from('project_comments')
      .update({ deleted_at: new Date().toISOString(), updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq('parent_id', body.id);
    if (deleteRepliesError) throw deleteRepliesError;

    const { error: deleteError } = await admin
      .from('project_comments')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'project_comments',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Commentaire supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[comments-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
