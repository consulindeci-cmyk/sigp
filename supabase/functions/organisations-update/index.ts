import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// L'organisation modifiée est toujours celle de l'appelant (profile.organisation_id) —
// jamais un id fourni par le client, pour éviter qu'un ADMIN modifie une autre organisation.
interface UpdateOrganisationBody {
  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    if (!profile.organisation_id) {
      return json({ error: "Aucune organisation associée à ce compte" }, 400);
    }

    const body: UpdateOrganisationBody = await req.json();

    const { data: existing, error: findError } = await admin
      .from('organisations')
      .select('*')
      .eq('id', profile.organisation_id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Organisation introuvable' }, 404);

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.nom !== undefined)       updatePayload.nom = body.nom.trim();
    if (body.adresse !== undefined)   updatePayload.adresse = body.adresse.trim();
    if (body.ville !== undefined)     updatePayload.ville = body.ville.trim();
    if (body.pays !== undefined)      updatePayload.pays = body.pays.trim();
    if (body.telephone !== undefined) updatePayload.telephone = body.telephone.trim();
    if (body.email !== undefined)     updatePayload.email = body.email.trim();
    if (body.siteWeb !== undefined)   updatePayload.site_web = body.siteWeb.trim();

    const { data: updated, error: updateError } = await admin
      .from('organisations')
      .update(updatePayload)
      .eq('id', profile.organisation_id)
      .select('*')
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'organisations',
      enregistrement_id: profile.organisation_id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[organisations-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
