import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateLogframeObjectiveBody {
  projectId: string;
  niveau: 'OBJECTIF_GLOBAL' | 'OBJECTIF_SPECIFIQUE' | 'RESULTAT' | 'ACTIVITE';
  code: string;
  libelle: string;
  description?: string;
  parentId?: string;
  ordre?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateLogframeObjectiveBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.niveau) return json({ error: 'niveau est obligatoire' }, 400);
    if (!body.code?.trim()) return json({ error: 'code est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);

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

    // L'objectif parent, s'il est fourni, doit exister (existence seulement,
    // réplique fidèle : NestJS ne vérifie pas ici la cohérence de projet).
    if (body.parentId) {
      const { data: parent, error: parentError } = await admin
        .from('logframe_objectives')
        .select('id')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'Objectif parent introuvable' }, 404);
    }

    const { data: objective, error: insertError } = await admin
      .from('logframe_objectives')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        niveau: body.niveau,
        code: body.code.trim().toUpperCase(),
        libelle: body.libelle.trim(),
        description: body.description?.trim() ?? null,
        parent_id: body.parentId ?? null,
        ordre: body.ordre ?? 0,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur l’objectif' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'logframe_objectives',
      enregistrement_id: objective.id,
      apres: objective,
    });

    return json({ data: objective }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-objectives-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
