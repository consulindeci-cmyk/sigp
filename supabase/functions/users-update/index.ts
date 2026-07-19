import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Champs modifiables : nom, prénom, téléphone, poste, bio, rôle, statut (actif).
// id, email, password ne sont volontairement PAS exposés (réplique UpdateUserDto).
interface UpdateUserBody {
  id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  poste?: string;
  bio?: string;
  role?: 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER';
  actif?: boolean;
  // SUPER_ADMIN uniquement — rattache un profil orphelin (organisation_id
  // NULL) à une organisation. Jamais de réaffectation d'un utilisateur déjà
  // rattaché (cf. validation plus bas) : pas de mouvement cross-organisation.
  organisationId?: string;
}

// SUPER_ADMIN volontairement exclu : jamais assignable via cet endpoint,
// même en injectant directement le corps de la requête (cf. audit — aucune
// validation d'enum n'existait ici auparavant, role était passé tel quel).
const ALLOWED_ROLES = new Set(['ADMIN', 'COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'AUDITEUR', 'VIEWER']);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);

    const body: UpdateUserBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);
    if (body.role !== undefined && !ALLOWED_ROLES.has(body.role)) {
      return json({ error: 'Rôle invalide' }, 400);
    }

    // Un utilisateur peut toujours modifier son propre profil (page "Mon compte") ;
    // modifier un AUTRE utilisateur reste réservé à ADMIN (page Utilisateurs).
    const isSelf = body.id === profile.id;
    if (!isSelf) {
      requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);
    } else if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
      if (body.role !== undefined) {
        return json({ error: 'Vous ne pouvez pas modifier votre propre rôle' }, 403);
      }
      // Auto-désactivation autorisée ("Désactiver mon compte", Zone dangereuse) ;
      // auto-réactivation interdite (un compte désactivé doit repasser par un ADMIN).
      if (body.actif === true) {
        return json({ error: 'Seul un administrateur peut réactiver votre compte' }, 403);
      }
    }

    const { data: existing, error: findError } = await admin
      .from('users')
      .select('id, nom, prenom, email, role, actif, telephone, poste, bio, organisation_id')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Utilisateur introuvable' }, 404);

    // Rattachement d'un profil orphelin (organisation_id NULL) : à la fois
    // depuis OrganisationFormModal (promotion "administrateur non assigné",
    // SUPER_ADMIN) et depuis le flux email-first de la page Utilisateurs
    // (ADMIN qui invite un email déjà connu mais orphelin — cf.
    // users-lookup-by-email). Un ADMIN ne peut rattacher que vers SA PROPRE
    // organisation, jamais une autre : pas de mouvement cross-organisation.
    const isOrphanAttach = body.organisationId !== undefined && existing.organisation_id === null;

    // Cloisonnement multi-tenant : un ADMIN (org_admin) ne peut modifier que
    // les utilisateurs de sa propre organisation — sauf le cas légitime
    // ci-dessus où la cible n'appartient encore à aucune organisation.
    if (!isSelf && !isOrphanAttach && profile.role !== 'SUPER_ADMIN' && existing.organisation_id !== profile.organisation_id) {
      return json({ error: "Cet utilisateur n'appartient pas à votre organisation" }, 403);
    }

    if (body.organisationId !== undefined) {
      const isSuperAdmin = profile.role === 'SUPER_ADMIN';
      const isOwnOrgAttach = profile.role === 'ADMIN' && body.organisationId === profile.organisation_id;
      if (!isSuperAdmin && !isOwnOrgAttach) {
        return json({ error: "Seul un administrateur (vers sa propre organisation) ou un Super Administrateur peut rattacher un utilisateur à une organisation" }, 403);
      }
      if (existing.organisation_id !== null) {
        return json({ error: 'Cet utilisateur appartient déjà à une organisation — réaffectation impossible' }, 409);
      }
      const { data: targetOrg, error: targetOrgError } = await admin
        .from('organisations')
        .select('id, statut')
        .eq('id', body.organisationId)
        .maybeSingle();
      if (targetOrgError) throw targetOrgError;
      if (!targetOrg) return json({ error: 'Organisation introuvable' }, 404);
      if (targetOrg.statut === 'SUSPENDUE') {
        return json({ error: 'Impossible de rattacher un utilisateur à une organisation suspendue' }, 400);
      }
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.prenom !== undefined) updatePayload.prenom = body.prenom.trim();
    if (body.telephone !== undefined) updatePayload.telephone = body.telephone?.trim() ?? null;
    if (body.poste !== undefined) updatePayload.poste = body.poste?.trim() ?? null;
    if (body.bio !== undefined) updatePayload.bio = body.bio?.trim() ?? null;
    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.actif !== undefined) updatePayload.actif = body.actif;
    if (body.organisationId !== undefined) updatePayload.organisation_id = body.organisationId;

    const { data: updated, error: updateError } = await admin
      .from('users')
      .update(updatePayload)
      .eq('id', body.id)
      .select('id, nom, prenom, email, role, actif, telephone, poste, bio, organisation_id')
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'users',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
