import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateTeamMemberBody {
  projectId: string;
  // Identité toujours résolue côté serveur depuis le profil sélectionné —
  // plus de saisie libre nom/prenom/email (cf. plan Phase 1 : le vivier de
  // membres éligibles est restreint aux utilisateurs de l'organisation du
  // projet, actifs ou PENDING).
  userId: string;
  role: string;
  structure?: string;
  telephone?: string;
  statut?: string;
  dateDebut?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateTeamMemberBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.userId) return json({ error: 'userId est obligatoire' }, 400);
    if (!body.role) return json({ error: 'role est obligatoire' }, 400);

    const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
      p_project_id: body.projectId,
    });
    if (orgError) throw orgError;
    if (!projectOrgId) return json({ error: 'Projet introuvable ou non rattaché à une organisation' }, 404);
    if (profile.role !== 'SUPER_ADMIN' && projectOrgId !== profile.organisation_id) {
      return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
    }

    const { data: pickedUser, error: userError } = await admin
      .from('users')
      .select('id, nom, prenom, email, telephone, organisation_id')
      .eq('id', body.userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (userError) throw userError;
    if (!pickedUser) return json({ error: 'Utilisateur introuvable' }, 404);
    if (pickedUser.organisation_id !== projectOrgId) {
      return json({ error: "Cet utilisateur n'appartient pas à l'organisation de ce projet" }, 403);
    }

    const { data: member, error: insertError } = await admin
      .from('project_team_members')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        user_id: pickedUser.id,
        nom: pickedUser.nom,
        prenom: pickedUser.prenom,
        role: body.role,
        structure: body.structure ?? '',
        email: pickedUser.email,
        telephone: body.telephone ?? pickedUser.telephone ?? '',
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
