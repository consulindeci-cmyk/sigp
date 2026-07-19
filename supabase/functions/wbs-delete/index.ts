import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteWbsNodeBody {
  id: string;
}

// La Matrice/le Gantt WBS n'agrègent budget et progression qu'à partir des
// nœuds atteignables depuis les racines (cf. aggregateBudgetProgression côté
// useWBS.ts) — sans ce parcours récursif, un soft-delete du seul nœud ciblé
// laissait ses enfants vivants en base tout en les rendant invisibles/
// orphelins (même bug que logframe-objectives-delete avant correction).
async function findDescendantIds(admin: SupabaseClient, rootId: string): Promise<string[]> {
  const allIds: string[] = [];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const { data: children, error } = await admin
      .from('wbs_nodes')
      .select('id')
      .in('parent_id', frontier)
      .is('deleted_at', null);
    if (error) throw error;
    const childIds = (children ?? []).map((c: { id: string }) => c.id);
    if (childIds.length === 0) break;
    allIds.push(...childIds);
    frontier = childIds;
  }
  return allIds;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteWbsNodeBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('wbs_nodes')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Nœud WBS introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce nœud n'appartient pas à votre organisation" }, 403);
      }
    }

    const descendantIds = await findDescendantIds(admin, body.id);
    const allIds = [body.id, ...descendantIds];

    // Garde-fou : ptba_activites.wbs_id est un lien applicatif sans FK — sans
    // ce contrôle, la cascade ci-dessous rendrait ces activités orphelines
    // (pointant vers un nœud soft-deleted) sans aucun avertissement, et leur
    // budget/avancement disparaîtrait silencieusement du rollup WBS.
    const { data: linkedActivites, error: activitesCheckError } = await admin
      .from('ptba_activites')
      .select('id, code, libelle')
      .in('wbs_id', allIds)
      .is('deleted_at', null);
    if (activitesCheckError) throw activitesCheckError;

    if ((linkedActivites?.length ?? 0) > 0) {
      const activites = linkedActivites ?? [];
      return json({
        error: `Suppression impossible : ce nœud (ou l'un de ses descendants) est encore référencé par ${activites.length} activité(s) PTBA (${activites.map(a => a.code).join(', ')}). Détachez d'abord ces liaisons.`,
        dependencies: { ptbaActivites: activites },
      }, 409);
    }

    const now = new Date().toISOString();

    const { error: deleteError } = await admin
      .from('wbs_nodes')
      .update({ deleted_at: now, updated_by: profile.id, updated_at: now })
      .in('id', allIds);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'wbs_nodes',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({
      message: descendantIds.length > 0
        ? `Nœud et ${descendantIds.length} descendant(s) supprimés`
        : 'Nœud WBS supprimé',
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[wbs-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
