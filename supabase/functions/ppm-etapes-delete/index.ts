import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeletePpmEtapeBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN']);

    const body: DeletePpmEtapeBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('ppm_etapes')
      .select('*')
      .eq('id', body.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Étape PPM introuvable' }, 404);

    const { data: marche } = await admin
      .from('ppm_marches')
      .select('project_id')
      .eq('id', existing.marche_id)
      .maybeSingle();

    // Reproduit fidèlement PpmEtapeRepository.softDelete() qui, malgré son
    // nom, fait un DELETE physique (pas de deleted_at sur cette table).
    const { error: deleteError } = await admin.from('ppm_etapes').delete().eq('id', body.id);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: marche?.project_id ?? null,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'ppm_etapes',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Étape PPM supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-etapes-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
