import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateWbsNodeBody {
  id: string;
  parentId?: string;
  objectiveId?: string;
  libelle?: string;
  type?: 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE';
  ordre?: number;
  responsableId?: string;
  dateDebut?: string;
  dateFin?: string;
  actif?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateWbsNodeBody = await req.json();
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

    if (body.objectiveId) {
      const { data: objective, error: objError } = await admin
        .from('logframe_objectives')
        .select('id')
        .eq('id', body.objectiveId)
        .is('deleted_at', null)
        .maybeSingle();
      if (objError) throw objError;
      if (!objective) return json({ error: 'Objectif du cadre logique introuvable' }, 404);
    }

    // Re-parentage : mêmes contrôles d'intégrité que WbsService.update
    let niveau: number | undefined;
    if (body.parentId) {
      if (body.parentId === body.id) {
        return json({ error: 'Un nœud ne peut pas être son propre parent' }, 409);
      }
      const { data: parent, error: parentError } = await admin
        .from('wbs_nodes')
        .select('id, project_id, parent_id, niveau')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'Nœud parent introuvable' }, 404);
      if (parent.parent_id === body.id) {
        return json({ error: 'Cycle direct détecté entre les deux nœuds' }, 409);
      }
      if (parent.project_id !== existing.project_id) {
        return json({ error: 'Le nœud parent appartient à un autre projet' }, 409);
      }
      niveau = parent.niveau + 1;
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.parentId !== undefined) updatePayload.parent_id = body.parentId;
    if (body.objectiveId !== undefined) updatePayload.objective_id = body.objectiveId;
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (niveau !== undefined) updatePayload.niveau = niveau;
    if (body.ordre !== undefined) updatePayload.ordre = body.ordre;
    if (body.responsableId !== undefined) updatePayload.responsable_id = body.responsableId;
    if (body.dateDebut !== undefined) updatePayload.date_debut = body.dateDebut;
    if (body.dateFin !== undefined) updatePayload.date_fin = body.dateFin;
    if (body.actif !== undefined) updatePayload.actif = body.actif;

    const { data: updated, error: updateError } = await admin
      .from('wbs_nodes')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur le nœud WBS' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'wbs_nodes',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[wbs-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
