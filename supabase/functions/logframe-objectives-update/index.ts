import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateLogframeObjectiveBody {
  id: string;
  niveau?: 'OBJECTIF_GLOBAL' | 'OBJECTIF_SPECIFIQUE' | 'RESULTAT' | 'ACTIVITE';
  libelle?: string;
  description?: string;
  parentId?: string;
  ordre?: number;
  actif?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateLogframeObjectiveBody = await req.json();
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

    // Le parent, s'il est fourni, doit exister et ne peut pas être l'objectif
    // lui-même (réplique LogframeObjectiveService.update — pas de vérification
    // de cohérence de projet, quirk d'origine reproduit fidèlement).
    if (body.parentId) {
      if (body.parentId === body.id) {
        return json({ error: 'Un objectif ne peut pas être son propre parent' }, 409);
      }
      const { data: parent, error: parentError } = await admin
        .from('logframe_objectives')
        .select('id')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'Objectif parent introuvable' }, 404);
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.niveau !== undefined) updatePayload.niveau = body.niveau;
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.description !== undefined) updatePayload.description = body.description?.trim() ?? null;
    if (body.parentId !== undefined) updatePayload.parent_id = body.parentId;
    if (body.ordre !== undefined) updatePayload.ordre = body.ordre;
    if (body.actif !== undefined) updatePayload.actif = body.actif;

    const { data: updated, error: updateError } = await admin
      .from('logframe_objectives')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur l’objectif' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'logframe_objectives',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-objectives-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
