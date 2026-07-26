import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import { INVITE_REDIRECT_TO } from '../_shared/frontendUrl.ts';

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
  // Premier utilisateur ADMIN (org_admin) de la nouvelle organisation. Aucun
  // mot de passe fourni ici : le compte est créé via invitation par e-mail
  // (cf. plus bas), l'administrateur choisit lui-même son mot de passe en
  // validant le lien reçu.
  adminNom: string;
  adminPrenom: string;
  adminEmail: string;
  adminTelephone?: string;
}

const ALLOWED_DEVISES = new Set(['XOF', 'EUR', 'USD']);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// organisations.code est NOT NULL sans défaut côté base et n'est exposé nulle
// part côté UI (pas de champ "code" dans le formulaire de création) — généré
// ici à partir du nom, avec un suffixe pour éviter toute collision.
const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

function generateOrganisationCode(nom: string): string {
  const base = nom
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20) || 'ORG';
  const suffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `${base}-${suffix}`;
}

// deno-lint-ignore no-explicit-any
type AdminClient = any;

interface PartialProvisioning {
  orgId?: string;
  directionId?: string;
  departementId?: string;
  uniteId?: string;
  programmeId?: string;
  adminUserId?: string;
}

// Les inserts organisation → hiérarchie → admin ne sont pas une transaction
// SQL unique (PostgREST ne le permet pas depuis ce client) : si une étape
// échoue après que des lignes précédentes ont déjà été créées, on les
// supprime explicitement pour ne jamais laisser une organisation "orpheline"
// (créée en base mais sans admin fonctionnel) alors que l'appelant reçoit une
// erreur. Best-effort et silencieux en cas d'échec du nettoyage lui-même —
// l'erreur d'origine reste celle renvoyée à l'appelant.
async function rollbackProvisioning(admin: AdminClient, ids: PartialProvisioning): Promise<void> {
  try {
    if (ids.adminUserId) await admin.from('users').delete().eq('id', ids.adminUserId);
    if (ids.programmeId) await admin.from('programmes').delete().eq('id', ids.programmeId);
    if (ids.uniteId) await admin.from('unites').delete().eq('id', ids.uniteId);
    if (ids.departementId) await admin.from('departements').delete().eq('id', ids.departementId);
    if (ids.directionId) await admin.from('directions').delete().eq('id', ids.directionId);
    if (ids.orgId) await admin.from('organisations').delete().eq('id', ids.orgId);
  } catch (cleanupErr) {
    console.error('[organisations-create] rollback failed — organisation potentiellement orpheline', ids, cleanupErr);
  }
}

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
        code: generateOrganisationCode(body.nom.trim()),
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
    if (orgError) {
      if (orgError.code === '23505') {
        return json({ error: 'Une organisation avec un code similaire existe déjà — réessayez.' }, 409);
      }
      throw orgError;
    }

    // À partir d'ici, l'organisation existe en base : toute sortie en erreur
    // doit passer par rollbackProvisioning() pour ne rien laisser d'orphelin.
    const provisioned: PartialProvisioning = { orgId: org.id };

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
    if (directionError) {
      await rollbackProvisioning(admin, provisioned);
      throw directionError;
    }
    provisioned.directionId = direction.id;

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
    if (departementError) {
      await rollbackProvisioning(admin, provisioned);
      throw departementError;
    }
    provisioned.departementId = departement.id;

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
    if (uniteError) {
      await rollbackProvisioning(admin, provisioned);
      throw uniteError;
    }
    provisioned.uniteId = unite.id;

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
    if (programmeError) {
      await rollbackProvisioning(admin, provisioned);
      throw programmeError;
    }
    provisioned.programmeId = programme.id;

    // 3. Premier org_admin — ligne SQL d'abord (jamais d'état orphelin), puis
    // invitation Supabase Auth. Contrairement à users-create (qui tolère un
    // échec de connexion et garde le profil avec un avertissement), un échec
    // ici déclenche un rollback complet : sans mot de passe fourni, un admin
    // sans invitation envoyée n'aurait aucun moyen de se connecter.
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
      await rollbackProvisioning(admin, provisioned);
      if (adminInsertError.code === '23505') {
        return json({ error: 'Cet email admin est déjà utilisé (ou associé à un compte supprimé/désactivé)' }, 409);
      }
      throw adminInsertError;
    }
    provisioned.adminUserId = adminUser.id;

    // inviteUserByEmail crée le compte Supabase Auth ET envoie l'e-mail
    // d'invitation en un seul appel (contrairement à createUser + un appel
    // séparé à inviteUserByEmail : ce dernier échoue silencieusement car
    // l'utilisateur existe déjà, donc aucun e-mail ne partait jamais — bug
    // corrigé ici). Aucun mot de passe fourni : l'administrateur choisit le
    // sien en validant le lien reçu.
    const { data: authUser, error: authError } = await admin.auth.admin.inviteUserByEmail(adminEmail, {
      redirectTo: INVITE_REDIRECT_TO,
      data: { profile_id: adminUser.id, nom: body.adminNom.trim(), prenom: body.adminPrenom.trim() },
    });

    if (authError || !authUser?.user) {
      console.error('[organisations-create] inviteUserByEmail failed', authError);
      await rollbackProvisioning(admin, provisioned);
      const alreadyRegistered = /already.*regist|already.*exist/i.test(authError?.message ?? '');
      return json(
        {
          error: alreadyRegistered
            ? "Cet email est déjà associé à un compte d'authentification existant."
            : `L'envoi de l'invitation à l'administrateur a échoué : ${authError?.message ?? 'erreur inconnue'}.`,
        },
        alreadyRegistered ? 409 : 502,
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

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      organisation_id: org.id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'organisations',
      enregistrement_id: org.id,
      apres: { organisation: org, direction, departement, unite, programme, admin: adminUser },
      });
    } catch (historiqueError) {
      console.error('[organisations-create] historique', historiqueError);
    }

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
