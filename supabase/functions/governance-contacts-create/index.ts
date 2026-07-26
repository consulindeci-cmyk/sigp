import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateContactBody {
  projectId: string;
  nom: string;
  prenom: string;
  organisation?: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  categorie: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateContactBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.nom?.trim() || !body.prenom?.trim()) return json({ error: 'nom et prenom sont obligatoires' }, 400);
    if (!body.categorie) return json({ error: 'categorie est obligatoire' }, 400);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: contact, error: insertError } = await admin
      .from('project_contacts')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        nom: body.nom.trim(),
        prenom: body.prenom.trim(),
        organisation: body.organisation ?? '',
        email: body.email ?? '',
        telephone: body.telephone ?? '',
        fonction: body.fonction ?? '',
        categorie: body.categorie,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insertError) throw insertError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'project_contacts',
      enregistrement_id: contact.id,
      apres: contact,
      });
    } catch (historiqueError) {
      console.error('[governance-contacts-create] historique', historiqueError);
    }

    return json({ data: contact }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[governance-contacts-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
