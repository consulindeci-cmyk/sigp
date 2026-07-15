// ═══════════════════════════════════════════════════════════════════════════
// Migration ponctuelle : provisionne un compte Supabase Auth pour chaque
// utilisateur réel encore non migré (auth_user_id IS NULL), puis déclenche
// l'email de réinitialisation de mot de passe (argon2 → GoTrue incompatible,
// aucun hash ne peut être importé).
//
// ⚠️ NE PAS EXÉCUTER EN MODE RÉEL avant le cutover d'authStore.ts — ce script
// envoie de vrais emails à de vrais utilisateurs. Toujours lancer d'abord en
// --dry-run pour valider la liste, puis avec --execute pour agir réellement.
//
// Usage (Deno) :
//   deno run --allow-net --allow-env scripts/migrate-users-to-supabase-auth.ts --dry-run
//   deno run --allow-net --allow-env scripts/migrate-users-to-supabase-auth.ts --execute
//   deno run --allow-net --allow-env scripts/migrate-users-to-supabase-auth.ts --execute --limit 5
//
// ⚠️ MODE TEST UNIQUEMENT — JAMAIS pour de vrais utilisateurs — bascule
// silencieuse sans email (mot de passe fixe connu, email_confirm: true).
// Sert uniquement à finir de tester des comptes de démo/seed déjà migrés
// dont l'email de reset a échoué (quota SMTP, TLD .local rejeté, etc.).
// Nécessite une liste explicite d'emails (pas de comportement par défaut
// large, pour éviter tout usage accidentel sur de vrais comptes) :
//   deno run --allow-net --allow-env scripts/migrate-users-to-supabase-auth.ts \
//     --set-test-passwords --emails=admin@sigp.ci,coord@sigp.ci
//
// Variables d'environnement requises :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//   PASSWORD_RESET_REDIRECT_URL (URL de la page "nouveau mot de passe" du front)
//   TEST_ONLY_PASSWORD (uniquement pour --set-test-passwords — jamais commité,
//   à définir dans l'environnement local au moment de l'exécution)
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const REDIRECT_URL = Deno.env.get('PASSWORD_RESET_REDIRECT_URL') ?? undefined;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et SUPABASE_ANON_KEY sont obligatoires.');
  Deno.exit(1);
}

const args = Deno.args;
const execute = args.includes('--execute');
const setTestPasswords = args.includes('--set-test-passwords');
const limitArg = args.find((a: string) => a.startsWith('--limit'));
const limit = limitArg ? Number(limitArg.split('=')[1] ?? args[args.indexOf(limitArg) + 1]) : undefined;
const emailsArg = args.find((a: string) => a.startsWith('--emails='));
const testEmails: string[] = emailsArg?.replace('--emails=', '').split(',').map((e: string) => e.trim().toLowerCase()) ?? [];
const TEST_ONLY_PASSWORD = Deno.env.get('TEST_ONLY_PASSWORD') ?? '';
const DELAY_MS = 2000; // rate-limiting : ~30 emails/minute max

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

interface LegacyUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
}

function randomThrowawayPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'Tmp-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') + 'Aa1!';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCandidates(): Promise<LegacyUser[]> {
  let query = adminClient
    .from('users')
    .select('id, email, nom, prenom')
    .is('deleted_at', null)
    .is('auth_user_id', null)
    .eq('actif', true)
    .order('created_at', { ascending: true });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as LegacyUser[];
}

async function migrateOne(user: LegacyUser): Promise<{ email: string; status: 'ok' | 'error'; detail?: string }> {
  try {
    // Idempotence : re-vérifie juste avant d'agir (relance sûre après interruption).
    const { data: fresh } = await adminClient
      .from('users')
      .select('auth_user_id')
      .eq('id', user.id)
      .maybeSingle();
    if (fresh?.auth_user_id) {
      return { email: user.email, status: 'ok', detail: 'déjà migré, ignoré' };
    }

    let authUserId: string;
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: user.email,
      password: randomThrowawayPassword(),
      email_confirm: true,
      user_metadata: { profile_id: user.id, nom: user.nom, prenom: user.prenom, migrated: true },
    });

    if (createError) {
      // Cas rare : compte GoTrue déjà créé lors d'une exécution précédente
      // interrompue avant la liaison — on le retrouve au lieu d'échouer.
      if (createError.message?.toLowerCase().includes('already registered')) {
        const { data: list, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = list.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());
        if (!existing) throw createError;
        authUserId = existing.id;
      } else {
        throw createError;
      }
    } else {
      authUserId = created.user.id;
    }

    const { error: linkError } = await adminClient
      .from('users')
      .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (linkError) throw linkError;

    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(user.email, {
      redirectTo: REDIRECT_URL,
    });
    if (resetError) throw resetError;

    return { email: user.email, status: 'ok', detail: `lié à auth_user_id=${authUserId}, email de reset envoyé` };
  } catch (err) {
    return { email: user.email, status: 'error', detail: (err as Error).message };
  }
}

// ⚠️ TEST UNIQUEMENT — jamais d'email envoyé, mot de passe fixe et connu.
// Couvre les deux cas : compte pas encore créé côté GoTrue (crée + lie), et
// compte déjà lié mais dont le mot de passe est un aléatoire jamais transmis
// (arrive quand resetPasswordForEmail échoue après une liaison réussie —
// ex : quota SMTP ou TLD .local rejeté par l'instance Supabase).
async function setTestPasswordFor(email: string): Promise<{ email: string; status: 'ok' | 'error'; detail?: string }> {
  try {
    const { data: profile, error: findError } = await adminClient
      .from('users')
      .select('id, nom, prenom, auth_user_id')
      .eq('email', email)
      .maybeSingle();
    if (findError) throw findError;
    if (!profile) return { email, status: 'error', detail: 'introuvable dans public.users' };

    if (!profile.auth_user_id) {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: TEST_ONLY_PASSWORD,
        email_confirm: true,
        user_metadata: { profile_id: profile.id, nom: profile.nom, prenom: profile.prenom, migrated: true, test_only: true },
      });
      if (createError) throw createError;

      const { error: linkError } = await adminClient
        .from('users')
        .update({ auth_user_id: created.user.id, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (linkError) throw linkError;

      return { email, status: 'ok', detail: `créé + lié à auth_user_id=${created.user.id}, mot de passe test défini` };
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(profile.auth_user_id, {
      password: TEST_ONLY_PASSWORD,
    });
    if (updateError) throw updateError;

    return { email, status: 'ok', detail: `déjà lié (auth_user_id=${profile.auth_user_id}), mot de passe test réinitialisé` };
  } catch (err) {
    return { email, status: 'error', detail: (err as Error).message };
  }
}

async function runSetTestPasswords() {
  if (testEmails.length === 0) {
    console.error('--set-test-passwords requiert --emails=a@x.com,b@y.com (pas de comportement par défaut).');
    Deno.exit(1);
  }
  if (!TEST_ONLY_PASSWORD) {
    console.error('--set-test-passwords requiert la variable d\'environnement TEST_ONLY_PASSWORD.');
    Deno.exit(1);
  }

  console.log('--- MODE TEST — aucun email envoyé, mot de passe défini via TEST_ONLY_PASSWORD ---');
  const results = [];
  for (const email of testEmails) {
    const result = await setTestPasswordFor(email);
    results.push(result);
    console.log(`  [${result.status.toUpperCase()}] ${result.email} — ${result.detail}`);
  }

  const okCount = results.filter((r) => r.status === 'ok').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  console.log(`\nTerminé : ${okCount} succès, ${errorCount} échec(s). Mot de passe (TEST_ONLY_PASSWORD) appliqué aux comptes traités ci-dessus.`);
}

async function main() {
  if (setTestPasswords) {
    await runSetTestPasswords();
    return;
  }

  const candidates = await fetchCandidates();

  console.log(`${candidates.length} compte(s) actif(s) non migré(s) trouvé(s).`);
  if (candidates.length === 0) return;

  if (!execute) {
    console.log('--- DRY RUN (aucune action réelle, aucun email envoyé) ---');
    for (const c of candidates) {
      console.log(`  [DRY-RUN] ${c.prenom} ${c.nom} <${c.email}> (id=${c.id})`);
    }
    console.log('\nRelancer avec --execute pour migrer réellement (ou --execute --limit N pour un test réduit).');
    return;
  }

  console.log(`--- EXÉCUTION RÉELLE — ${candidates.length} email(s) vont être envoyés ---`);
  const results: Array<{ email: string; status: 'ok' | 'error'; detail?: string }> = [];

  for (const user of candidates) {
    const result = await migrateOne(user);
    results.push(result);
    console.log(`  [${result.status.toUpperCase()}] ${result.email} — ${result.detail}`);
    await sleep(DELAY_MS);
  }

  const okCount = results.filter((r) => r.status === 'ok').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  console.log(`\nTerminé : ${okCount} succès, ${errorCount} échec(s).`);
  if (errorCount > 0) {
    console.log('Échecs à traiter manuellement :');
    results.filter((r) => r.status === 'error').forEach((r) => console.log(`  - ${r.email} : ${r.detail}`));
  }
}

await main();
