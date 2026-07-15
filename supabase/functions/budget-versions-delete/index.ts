import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteBudgetVersionBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN']);

    const body: DeleteBudgetVersionBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('budget_versions')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Version budgétaire introuvable' }, 404);

    const { error: deleteError } = await admin
      .from('budget_versions')
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
      table_cible: 'budget_versions',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Version budgétaire supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-versions-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
