import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Réservé SUPER_ADMIN — créer une organisation revient à onboarder un nouveau
// tenant complet : la ligne organisations elle-même, une hiérarchie minimale
// auto-provisionnée (direction/département/unité/programme, sans quoi aucun
// projet ne pourrait jamais être créé dans cette organisation, cf.
// projects-create qui exige un programmeId), et son premier org_admin.
interface CreateOrganisationBody {
  nom: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  deviseDefaut?: string;
  identifiantFiscal?: string;
  // Premier utilisateur ADMIN (org_admin) de la nouvelle organisation.
  adminNom: string;
  adminPrenom: string;
  adminEmail: string;
  adminPassword: string;
  adminTelephone?: string;
}

const ALLOWED_DEVISES = new Set(['XOF', 'EUR', 'USD']);

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['SUPER_ADMIN']);

    const body: CreateOrganisationBody = await req.json();
    if (!body.nom?.trim()) return json({ error: "Le nom de l'organisation est obligatoire" }, 400);
    if (!body.adminNom?.trim() || !body.adminPrenom?.trim()) {
      return json({ error: "Nom et prénom de l'administrateur sont obligatoires" }, 400);
    }
    const adminEmail = body.adminEmail?.trim().toLowerCase();
    if (!adminEmail || !EMAIL_REGEX.test(adminEmail)) {
      return json({ error: "L'adresse email de l'administrateur est invalide" }, 400);
    }
    if (!body.adminPassword || !PASSWORD_REGEX.test(body.adminPassword)) {
      return json(
        { error: 'Le mot de passe admin doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial' },
        400,
      );
    }
    const deviseDefaut = body.deviseDefaut?.trim().toUpperCase() || 'XOF';
    if (!ALLOWED_DEVISES.has(deviseDefaut)) {
      return json({ error: 'Devise par défaut invalide (XOF, EUR ou USD attendu)' }, 400);
    }

    const { data: existingUser, error: existingUserError } = await admin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingUserError) throw existingUserError;
    if (existingUser) return json({ error: 'Cet email admin est déjà utilisé par un compte actif' }, 409);

    const now = new Date().toISOString();

    // 1. Organisation
    const { data: org, error: orgError } = await admin
      .from('organisations')
      .insert({
        id: crypto.randomUUID(),
        nom: body.nom.trim(),
        adresse: body.adresse?.trim() ?? null,
        ville: body.ville?.trim() ?? null,
        pays: body.pays?.trim() ?? null,
        telephone: body.telephone?.trim() ?? null,
        email: body.email?.trim() ?? null,
        site_web: body.siteWeb?.trim() ?? null,
        devise_defaut: deviseDefaut,
        identifiant_fiscal: body.identifiantFiscal?.trim() || null,
        updated_at: now,
      })
      .select('*')
      .single();
    if (orgError) throw orgError;

    // 2. Hiérarchie minimale auto-provisionnée (invisible pour l'org_admin —
    // lui permet juste de créer des projets immédiatement).
    const { data: direction, error: directionError } = await admin
      .from('directions')
      .insert({
        id: crypto.randomUUID(),
        organisation_id: org.id,
        code: 'DG',
        nom: 'Direction Générale',
        updated_at: now,
      })
      .select('id')
      .single();
    if (directionError) throw directionError;

    const { data: departement, error: departementError } = await admin
      .from('departements')
      .insert({
        id: crypto.randomUUID(),
        direction_id: direction.id,
        code: 'DEP-01',
        nom: 'Département Principal',
        updated_at: now,
      })
      .select('id')
      .single();
    if (departementError) throw departementError;

    const { data: unite, error: uniteError } = await admin
      .from('unites')
      .insert({
        id: crypto.randomUUID(),
        departement_id: departement.id,
        code: 'UNI-01',
        nom: 'Unité Principale',
        updated_at: now,
      })
      .select('id')
      .single();
    if (uniteError) throw uniteError;

    const { data: programme, error: programmeError } = await admin
      .from('programmes')
      .insert({
        id: crypto.randomUUID(),
        unite_id: unite.id,
        code: 'PRG-01',
        nom: 'Programme Principal',
        updated_at: now,
      })
      .select('id')
      .single();
    if (programmeError) throw programmeError;

    // 3. Premier org_admin — même séquence que users-create : ligne SQL
    // d'abord (jamais d'état orphelin), puis compte Supabase Auth réel,
    // puis liaison. Best-effort sur l'étape Auth, surfacé si échec.
    const { data: adminUser, error: adminInsertError } = await admin
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        nom: body.adminNom.trim(),
        prenom: body.adminPrenom.trim(),
        email: adminEmail,
        mot_de_passe: 'SUPABASE_AUTH_MANAGED',
        role: 'ADMIN',
        actif: true,
        telephone: body.adminTelephone?.trim() ?? null,
        organisation_id: org.id,
        updated_at: now,
      })
      .select('id, nom, prenom, email, role, actif, telephone, organisation_id, created_at')
      .single();
    if (adminInsertError) {
      if (adminInsertError.code === '23505') {
        return json({ error: 'Cet email admin est déjà utilisé (ou associé à un compte supprimé/désactivé)' }, 409);
      }
      throw adminInsertError;
    }

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: body.adminPassword,
      email_confirm: false,
      user_metadata: { profile_id: adminUser.id, nom: body.adminNom.trim(), prenom: body.adminPrenom.trim() },
    });

    if (!authError && authUser?.user) {
      admin.auth.admin.inviteUserByEmail(adminEmail, {
        data: { profile_id: adminUser.id, nom: body.adminNom.trim(), prenom: body.adminPrenom.trim() },
      }).catch((e) => console.warn('[organisations-create] Envoi de l\'e-mail d\'invitation échoué :', e));
    }

    if (authError || !authUser?.user) {
      console.error('[organisations-create] GoTrue createUser failed', authError);
      return json(
        {
          data: { organisation: org, admin: adminUser },
          warning:
            `Organisation et profil admin créés mais la création du compte de connexion a échoué : ${authError?.message ?? 'erreur inconnue'}. ` +
            'Provisioning manuel du compte Supabase Auth requis (auth_user_id à lier).',
        },
        201,
      );
    }

    let linkError = (await admin
      .from('users')
      .update({ auth_user_id: authUser.user.id, updated_at: new Date().toISOString() })
      .eq('id', adminUser.id)).error;

    if (linkError) {
      linkError = (await admin
        .from('users')
        .update({ auth_user_id: authUser.user.id, updated_at: new Date().toISOString() })
        .eq('id', adminUser.id)).error;
    }

    if (linkError) {
      console.error('[organisations-create] auth_user_id linking failed after retry', linkError);
      return json(
        {
          data: { organisation: org, admin: adminUser },
          warning:
            `Compte de connexion créé (auth_user_id=${authUser.user.id}) mais la liaison au profil ` +
            `(id=${adminUser.id}) a échoué après un nouvel essai : ${linkError.message}. Liaison manuelle requise.`,
        },
        201,
      );
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'organisations',
      enregistrement_id: org.id,
      apres: { organisation: org, direction, departement, unite, programme, admin: adminUser },
    });

    return json({
      data: {
        organisation: org,
        admin: { ...adminUser, auth_user_id: authUser.user.id },
      },
    }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[organisations-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
