import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateWbsNodeBody {
  projectId: string;
  parentId?: string;
  objectiveId?: string;
  code: string;
  libelle: string;
  type: 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE';
  ordre?: number;
  responsableId?: string;
  dateDebut?: string;
  dateFin?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateWbsNodeBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.code?.trim()) return json({ error: 'code est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
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

    // Détermine le niveau à partir du parent (réplique WbsService.create)
    let niveau = 1;
    if (body.parentId) {
      const { data: parent, error: parentError } = await admin
        .from('wbs_nodes')
        .select('id, project_id, niveau')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'Nœud parent introuvable' }, 404);
      if (parent.project_id !== body.projectId) {
        return json({ error: 'Le nœud parent appartient à un autre projet' }, 409);
      }
      niveau = parent.niveau + 1;
    }

    const { data: node, error: insertError } = await admin
      .from('wbs_nodes')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        parent_id: body.parentId ?? null,
        objective_id: body.objectiveId ?? null,
        code: body.code.trim(),
        libelle: body.libelle.trim(),
        type: body.type,
        niveau,
        ordre: body.ordre ?? 0,
        responsable_id: body.responsableId ?? null,
        date_debut: body.dateDebut ?? null,
        date_fin: body.dateFin ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur le nœud WBS' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'wbs_nodes',
      enregistrement_id: node.id,
      apres: node,
    });

    return json({ data: node }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[wbs-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
