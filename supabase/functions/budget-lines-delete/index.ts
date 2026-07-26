import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteBudgetLineBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteBudgetLineBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('budget_lignes')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Ligne budgétaire introuvable' }, 404);

    const { data: version } = await admin
      .from('budget_versions')
      .select('project_id')
      .eq('id', existing.version_id)
      .maybeSingle();

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: version?.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette ligne n'appartient pas à votre organisation" }, 403);
      }
    }

    const { error: deleteError } = await admin
      .from('budget_lignes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: version?.project_id ?? null,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'budget_lignes',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[budget-lines-delete] historique', historiqueError);
    }

    return json({ message: 'Ligne budgétaire supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-lines-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
