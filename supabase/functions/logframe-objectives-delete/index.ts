import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteLogframeObjectiveBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteLogframeObjectiveBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('logframe_objectives')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Objectif introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cet objectif n'appartient pas à votre organisation" }, 403);
      }
    }

    const { error: deleteError } = await admin
      .from('logframe_objectives')
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
      table_cible: 'logframe_objectives',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Objectif supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-objectives-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
