import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteLogframeIndicatorBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteLogframeIndicatorBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('logframe_indicators')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Indicateur introuvable' }, 404);

    const { data: objective } = await admin
      .from('logframe_objectives')
      .select('project_id')
      .eq('id', existing.objective_id)
      .maybeSingle();

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('logframe_objective_organisation_id', {
        p_objective_id: existing.objective_id,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cet indicateur n'appartient pas à votre organisation" }, 403);
      }
    }

    const { error: deleteError } = await admin
      .from('logframe_indicators')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: objective?.project_id ?? null,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'logframe_indicators',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Indicateur supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-indicators-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
