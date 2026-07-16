import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateTeamMemberBody {
  projectId: string;
  nom: string;
  prenom: string;
  role: string;
  structure?: string;
  email: string;
  telephone?: string;
  statut?: string;
  dateDebut?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN']);

    const body: CreateTeamMemberBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.nom?.trim() || !body.prenom?.trim()) return json({ error: 'nom et prenom sont obligatoires' }, 400);
    if (!body.role) return json({ error: 'role est obligatoire' }, 400);
    if (!body.email?.trim()) return json({ error: 'email est obligatoire' }, 400);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: member, error: insertError } = await admin
      .from('project_team_members')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        nom: body.nom.trim(),
        prenom: body.prenom.trim(),
        role: body.role,
        structure: body.structure ?? '',
        email: body.email.trim(),
        telephone: body.telephone ?? '',
        statut: body.statut ?? 'Actif',
        date_debut: body.dateDebut ?? null,
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
      table_cible: 'project_team_members',
      enregistrement_id: member.id,
      apres: member,
    });

    return json({ data: member }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[governance-team-members-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
