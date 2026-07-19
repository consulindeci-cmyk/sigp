import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteLogframeObjectiveBody {
  id: string;
}

// L'UI (LogframePage) prévient l'utilisateur que la suppression emporte
// aussi "tous ses éléments subordonnés" — sans ce parcours récursif, seule
// la ligne ciblée était soft-deleted et ses enfants restaient vivants en
// base tout en devenant invisibles dans la matrice (parent absent de la
// requête filtrée sur deleted_at IS NULL) : des lignes orphelines
// définitivement inaccessibles depuis l'UI.
async function findDescendantIds(admin: SupabaseClient, rootId: string): Promise<string[]> {
  const allIds: string[] = [];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const { data: children, error } = await admin
      .from('logframe_objectives')
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

    const descendantIds = await findDescendantIds(admin, body.id);
    const allIds = [body.id, ...descendantIds];

    // Garde-fou : wbs_nodes.objective_id et ptba_activites.logframe_ref_id
    // sont des liens applicatifs sans FK (cf. audit d'intégrité) — sans ce
    // contrôle, la cascade ci-dessous rendrait ces lignes orphelines
    // (pointant vers un objectif/indicateur soft-deleted) sans aucun
    // avertissement. On bloque plutôt que de laisser un lien mort derrière.
    const { data: linkedWbsNodes, error: wbsCheckError } = await admin
      .from('wbs_nodes')
      .select('id, code, libelle')
      .in('objective_id', allIds)
      .is('deleted_at', null);
    if (wbsCheckError) throw wbsCheckError;

    const { data: linkedIndicators, error: indicatorsLookupError } = await admin
      .from('logframe_indicators')
      .select('id')
      .in('objective_id', allIds)
      .is('deleted_at', null);
    if (indicatorsLookupError) throw indicatorsLookupError;
    const indicatorIds = (linkedIndicators ?? []).map((i: { id: string }) => i.id);

    let linkedPtbaActivites: { id: string; code: string; libelle: string }[] = [];
    if (indicatorIds.length > 0) {
      const { data: ptbaData, error: ptbaCheckError } = await admin
        .from('ptba_activites')
        .select('id, code, libelle')
        .in('logframe_ref_id', indicatorIds)
        .is('deleted_at', null);
      if (ptbaCheckError) throw ptbaCheckError;
      linkedPtbaActivites = ptbaData ?? [];
    }

    if ((linkedWbsNodes?.length ?? 0) > 0 || linkedPtbaActivites.length > 0) {
      const wbsNodes = (linkedWbsNodes ?? []).map((n: { id: string; code: string; libelle: string }) => ({ id: n.id, code: n.code, libelle: n.libelle }));
      const parts: string[] = [];
      if (wbsNodes.length > 0) {
        parts.push(`${wbsNodes.length} nœud(s) WBS (${wbsNodes.map(n => n.code).join(', ')})`);
      }
      if (linkedPtbaActivites.length > 0) {
        parts.push(`${linkedPtbaActivites.length} activité(s) PTBA (${linkedPtbaActivites.map(a => a.code).join(', ')})`);
      }
      // Le message texte porte l'essentiel du détail : invokeEdgeFunction
      // (côté frontend) ne transmet que le champ `error` en cas d'échec, pas
      // le corps JSON complet — dependencies reste disponible pour un futur
      // usage programmatique mais ne doit pas être la seule source du détail.
      return json({
        error: `Suppression impossible : cet objectif (ou l'un de ses éléments subordonnés) est encore référencé par ${parts.join(' et ')}. Détachez d'abord ces liaisons.`,
        dependencies: {
          wbsNodes,
          ptbaActivites: linkedPtbaActivites.map(a => ({ id: a.id, code: a.code, libelle: a.libelle })),
        },
      }, 409);
    }

    const now = new Date().toISOString();

    const { error: deleteError } = await admin
      .from('logframe_objectives')
      .update({ deleted_at: now, updated_by: profile.id, updated_at: now })
      .in('id', allIds);
    if (deleteError) throw deleteError;

    const { error: deleteIndicatorsError } = await admin
      .from('logframe_indicators')
      .update({ deleted_at: now, updated_by: profile.id, updated_at: now })
      .in('objective_id', allIds)
      .is('deleted_at', null);
    if (deleteIndicatorsError) throw deleteIndicatorsError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'logframe_objectives',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: descendantIds.length > 0 ? `Objectif et ${descendantIds.length} élément(s) subordonné(s) supprimés` : 'Objectif supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-objectives-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
