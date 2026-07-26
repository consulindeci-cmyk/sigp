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
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

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

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette version n'appartient pas à votre organisation" }, 403);
      }
    }

    const now = new Date().toISOString();

    const { error: deleteError } = await admin
      .from('budget_versions')
      .update({
        deleted_at: now,
        updated_by: profile.id,
        updated_at: now,
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    // Cascade : sans ce soft-delete, les lignes restaient actives
    // (deleted_at IS NULL) sous une version elle-même supprimée — orphelines
    // au sens applicatif, invisibles dans l'UI (qui ne charge que la version
    // active) mais toujours en base, potentiellement réinjectées si la
    // version était un jour restaurée. Même patron que
    // logframe-objectives-delete / ptba-delete / wbs-delete.
    const { data: cascadedLignes, error: cascadeError } = await admin
      .from('budget_lignes')
      .update({ deleted_at: now, updated_by: profile.id, updated_at: now })
      .eq('version_id', body.id)
      .is('deleted_at', null)
      .select('id');
    if (cascadeError) throw cascadeError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'budget_versions',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[budget-versions-delete] historique', historiqueError);
    }

    const cascadedCount = cascadedLignes?.length ?? 0;
    return json({
      message: cascadedCount > 0
        ? `Version budgétaire et ${cascadedCount} ligne(s) associée(s) supprimées`
        : 'Version budgétaire supprimée',
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-versions-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
