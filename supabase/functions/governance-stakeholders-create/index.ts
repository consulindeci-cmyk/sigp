import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateStakeholderBody {
  projectId: string;
  organisation: string;
  type: string;
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

    const body: CreateStakeholderBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.organisation?.trim()) return json({ error: 'organisation est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: stakeholder, error: insertError } = await admin
      .from('project_stakeholders')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        organisation: body.organisation.trim(),
        type: body.type,
        representant: body.representant ?? '',
        email: body.email ?? '',
        telephone: body.telephone ?? '',
        niveau_engagement: body.niveauEngagement ?? 'Moyen',
        statut: body.statut ?? 'Actif',
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'project_stakeholders',
      enregistrement_id: stakeholder.id,
      apres: stakeholder,
    });

    return json({ data: stakeholder }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[governance-stakeholders-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
