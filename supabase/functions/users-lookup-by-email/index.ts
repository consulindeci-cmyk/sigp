import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Porte d'entrée unique pour ajouter un email au niveau Organisation
// (page Utilisateurs) — flux "email d'abord" : avant de proposer la saisie
// de nom/prénom, on vérifie si un profil existe déjà pour cet email.
// service_role nécessaire : RLS scope `users` par organisation, un org_admin
// ne peut pas voir un profil d'une autre organisation via une requête client
// directe (nécessaire pour distinguer 'other_org' de 'new').

interface LookupBody {
  email: string;
  // SUPER_ADMIN uniquement — organisation ciblée (le formulaire "Provisionner
  // un administrateur" choisit explicitement l'organisation). Pour un
  // ADMIN (org_admin), toujours sa propre organisation.
  organisationId?: string;
}

type LookupStatus = 'new' | 'same_org' | 'orphan' | 'other_org';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: LookupBody = await req.json();
    const email = body.email?.trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      return json({ error: "L'adresse email est invalide" }, 400);
    }

    // Un ADMIN (org_admin) ne peut lookup que dans le contexte de sa propre
    // organisation — organisationId fourni n'est honoré que pour SUPER_ADMIN.
    const targetOrgId = profile.role === 'SUPER_ADMIN' && body.organisationId
      ? body.organisationId
      : profile.organisation_id;

    const { data: existing, error: findError } = await admin
      .from('users')
      .select('id, nom, prenom, organisation_id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;

    if (!existing) {
      return json({ data: { status: 'new' as LookupStatus } });
    }

    if (existing.organisation_id === null) {
      return json({
        data: { status: 'orphan' as LookupStatus, id: existing.id, nom: existing.nom, prenom: existing.prenom },
      });
    }

    if (existing.organisation_id === targetOrgId) {
      return json({
        data: { status: 'same_org' as LookupStatus, nom: existing.nom, prenom: existing.prenom },
      });
    }

    // Appartient à une autre organisation — pas d'id renvoyé, aucune action
    // possible dessus depuis ce flux (cloisonnement multi-tenant).
    return json({
      data: { status: 'other_org' as LookupStatus, nom: existing.nom, prenom: existing.prenom },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-lookup-by-email]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
