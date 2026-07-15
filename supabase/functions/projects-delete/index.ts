import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteProjectBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Alignement strict avec le NestJS d'origine : suppression réservée à ADMIN.
    requireRole(profile, ['ADMIN']);

    const body: DeleteProjectBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('projects')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Projet introuvable' }, 404);

    // Soft delete — jamais de suppression physique (cohérent avec le
    // comportement NestJS : deleted_at horodaté, ligne conservée).
    const { error: deleteError } = await admin
      .from('projects')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'projects',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Projet supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[projects-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
