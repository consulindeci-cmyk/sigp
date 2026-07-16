import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface RestoreProjectBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Même rôle que projects-delete (ADMIN seul).
    requireRole(profile, ['ADMIN']);

    const body: RestoreProjectBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('projects')
      .select('*')
      .eq('id', body.id)
      .not('deleted_at', 'is', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Projet introuvable dans la corbeille' }, 404);

    const { data: restored, error: restoreError } = await admin
      .from('projects')
      .update({ deleted_at: null, updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select('*')
      .single();
    if (restoreError) throw restoreError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.id,
      user_id: profile.id,
      action: 'RESTORE',
      table_cible: 'projects',
      enregistrement_id: body.id,
      avant: existing,
      apres: restored,
    });

    return json({ data: restored });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[projects-restore]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
