import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateStakeholderBody {
  id: string;
  organisation?: string;
  type?: string;
  representant?: string;
  email?: string;
  telephone?: string;
  niveauEngagement?: string;
  statut?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateStakeholderBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('project_stakeholders')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Partie prenante introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette partie prenante n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.organisation !== undefined) updatePayload.organisation = body.organisation.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.representant !== undefined) updatePayload.representant = body.representant;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.telephone !== undefined) updatePayload.telephone = body.telephone;
    if (body.niveauEngagement !== undefined) updatePayload.niveau_engagement = body.niveauEngagement;
    if (body.statut !== undefined) updatePayload.statut = body.statut;

    const { data: updated, error: updateError } = await admin
      .from('project_stakeholders')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'project_stakeholders',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[governance-stakeholders-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
