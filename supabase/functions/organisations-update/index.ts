import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// L'organisation modifiée est celle de l'appelant (profile.organisation_id)
// par défaut — jamais un id fourni par le client pour un ADMIN, pour éviter
// qu'il modifie une autre organisation. Un SUPER_ADMIN peut en revanche cibler
// n'importe quelle organisation via organisationId (page d'administration
// des organisations), même pattern que users-create pour organisationId.
interface UpdateOrganisationBody {
  organisationId?: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  deviseDefaut?: string;
  identifiantFiscal?: string;
  // ACTIVE | SUSPENDUE — une organisation suspendue bloque tous ses
  // utilisateurs dès le prochain appel, vérifié centralement dans authorize().
  statut?: string;
}

const ALLOWED_DEVISES = new Set(['XOF', 'EUR', 'USD']);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: UpdateOrganisationBody = await req.json();

    const targetOrganisationId = profile.role === 'SUPER_ADMIN' && body.organisationId
      ? body.organisationId
      : profile.organisation_id;

    if (!targetOrganisationId) {
      return json({ error: "Aucune organisation associée à ce compte" }, 400);
    }

    const { data: existing, error: findError } = await admin
      .from('organisations')
      .select('*')
      .eq('id', targetOrganisationId)
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
    if (body.deviseDefaut !== undefined) {
      const deviseDefaut = body.deviseDefaut.trim().toUpperCase();
      if (!ALLOWED_DEVISES.has(deviseDefaut)) {
        return json({ error: 'Devise par défaut invalide (XOF, EUR ou USD attendu)' }, 400);
      }
      updatePayload.devise_defaut = deviseDefaut;
    }
    if (body.identifiantFiscal !== undefined) {
      updatePayload.identifiant_fiscal = body.identifiantFiscal.trim() || null;
    }
    if (body.statut !== undefined) {
      // Seul un SUPER_ADMIN peut suspendre/réactiver une organisation — un
      // org_admin ne devrait jamais pouvoir se réactiver lui-même après coup.
      if (profile.role !== 'SUPER_ADMIN') {
        return json({ error: 'Seul un Super Administrateur peut modifier le statut de l\'organisation' }, 403);
      }
      updatePayload.statut = body.statut;
    }

    const { data: updated, error: updateError } = await admin
      .from('organisations')
      .update(updatePayload)
      .eq('id', targetOrganisationId)
      .select('*')
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      organisation_id: targetOrganisationId,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'organisations',
      enregistrement_id: targetOrganisationId,
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
