import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateContactBody {
  id: string;
  nom?: string;
  prenom?: string;
  organisation?: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  categorie?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateContactBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('project_contacts')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Contact introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce contact n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.prenom !== undefined) updatePayload.prenom = body.prenom.trim();
    if (body.organisation !== undefined) updatePayload.organisation = body.organisation;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.telephone !== undefined) updatePayload.telephone = body.telephone;
    if (body.fonction !== undefined) updatePayload.fonction = body.fonction;
    if (body.categorie !== undefined) updatePayload.categorie = body.categorie;

    const { data: updated, error: updateError } = await admin
      .from('project_contacts')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();
    if (updateError) throw updateError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'project_contacts',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
      });
    } catch (historiqueError) {
      console.error('[governance-contacts-update] historique', historiqueError);
    }

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[governance-contacts-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
