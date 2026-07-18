import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateUserBody {
  nom: string;
  prenom: string;
  email: string;
  role?: 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER';
  telephone?: string;
  organisationId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: CreateUserBody = await req.json();
    if (!body.nom?.trim()) return json({ error: 'Le nom est obligatoire' }, 400);
    if (!body.prenom?.trim()) return json({ error: 'Le prénom est obligatoire' }, 400);
    if (!body.email?.trim() || !EMAIL_REGEX.test(body.email.trim())) {
      return json({ error: "L'adresse email est invalide" }, 400);
    }
    const email = body.email.trim().toLowerCase();

    // org_admin (ADMIN scopé) ne peut créer que dans sa propre organisation —
    // tout organisationId qu'il fournirait est ignoré, et son choix de rôle
    // reste libre parmi les 6 rôles non-plateforme (y compris ADMIN, pour
    // ajouter un co-administrateur à sa propre organisation).
    //
    // SUPER_ADMIN, en revanche, ne gère pas les utilisateurs métier des
    // organisations — sa seule action possible ici est de provisionner un
    // administrateur d'organisation (ADMIN) rattaché à une organisation
    // active explicite. Toute autre valeur de rôle, ou une organisation
    // absente/inexistante/suspendue, est rejetée.
    let organisationId: string | null;
    if (profile.role === 'SUPER_ADMIN') {
      if (body.role && body.role !== 'ADMIN') {
        return json({ error: "Un SUPER_ADMIN ne peut créer que des administrateurs d'organisation (ADMIN)" }, 403);
      }
      if (!body.organisationId) {
        return json({ error: "L'organisation de rattachement est obligatoire" }, 400);
      }
      const { data: targetOrg, error: targetOrgError } = await admin
        .from('organisations')
        .select('id, statut')
        .eq('id', body.organisationId)
        .maybeSingle();
      if (targetOrgError) throw targetOrgError;
      if (!targetOrg) return json({ error: 'Organisation introuvable' }, 404);
      if (targetOrg.statut === 'SUSPENDUE') {
        return json({ error: 'Impossible de rattacher un administrateur à une organisation suspendue' }, 400);
      }
      organisationId = body.organisationId;
    } else {
      organisationId = profile.organisation_id;
    }
    // Forcé côté serveur (jamais déduit de body.role) : un SUPER_ADMIN crée
    // toujours un ADMIN, même si le champ était omis côté client.
    const finalRole = profile.role === 'SUPER_ADMIN' ? 'ADMIN' : (body.role ?? 'VIEWER');

    // Pré-check : email déjà utilisé par un compte actif (réplique findByEmail).
    const { data: existing, error: existingError } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ error: 'Cet email est déjà utilisé par un compte actif' }, 409);

    // 1. SQL d'abord — un échec ici ne laisse aucun état orphelin.
    const { data: newUser, error: insertError } = await admin
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        nom: body.nom.trim(),
        prenom: body.prenom.trim(),
        email,
        mot_de_passe: 'SUPABASE_AUTH_MANAGED', // legacy NOT NULL, jamais utilisé pour l'auth réelle
        role: finalRole,
        actif: true, // pas de vrai défaut DB sur cette colonne — sans ceci, actif reste NULL
        telephone: body.telephone?.trim() ?? null,
        organisation_id: organisationId,
        updated_at: new Date().toISOString(),
      })
      .select('id, nom, prenom, email, role, actif, telephone, organisation_id, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Cet email est déjà utilisé (ou associé à un compte supprimé/désactivé)' }, 409);
      }
      throw insertError;
    }

    // 2. GoTrue ensuite — inviteUserByEmail crée le compte ET envoie l'e-mail
    // d'invitation en un seul appel. Avant, createUser() créait le compte
    // silencieusement (aucun mail envoyé) puis un second appel à
    // inviteUserByEmail échouait car l'utilisateur existait déjà — échec
    // avalé par un .catch(), donc aucune invitation ne partait jamais. Aucun
    // mot de passe fourni : le destinataire choisit le sien via le lien reçu.
    const { data: authUser, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { profile_id: newUser.id, nom: body.nom.trim(), prenom: body.prenom.trim() },
    });

    if (authError || !authUser?.user) {
      console.error('[users-create] inviteUserByEmail failed', authError);
      await admin.from('users').delete().eq('id', newUser.id);
      const alreadyRegistered = /already.*regist|already.*exist/i.test(authError?.message ?? '');
      return json(
        {
          error: alreadyRegistered
            ? "Cet email est déjà associé à un compte d'authentification existant."
            : `L'envoi de l'invitation a échoué : ${authError?.message ?? 'erreur inconnue'}.`,
        },
        alreadyRegistered ? 409 : 502,
      );
    }

    // 3. Liaison — simple UPDATE par PK, retry unique en cas d'échec transitoire.
    let linkError = (await admin
      .from('users')
      .update({ auth_user_id: authUser.user.id, updated_at: new Date().toISOString() })
      .eq('id', newUser.id)).error;

    if (linkError) {
      linkError = (await admin
        .from('users')
        .update({ auth_user_id: authUser.user.id, updated_at: new Date().toISOString() })
        .eq('id', newUser.id)).error;
    }

    if (linkError) {
      console.error('[users-create] auth_user_id linking failed after retry', linkError);
      return json(
        {
          data: newUser,
          warning:
            `Compte de connexion créé (auth_user_id=${authUser.user.id}) mais la liaison au profil ` +
            `(id=${newUser.id}) a échoué après un nouvel essai : ${linkError.message}. Liaison manuelle requise.`,
        },
        201,
      );
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'users',
      enregistrement_id: newUser.id,
      apres: newUser,
    });

    return json({ data: { ...newUser, auth_user_id: authUser.user.id } }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
