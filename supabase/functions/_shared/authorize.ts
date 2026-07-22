import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface AppUser {
  id: string;
  role: string;
  organisation_id: string | null;
}

export interface AuthorizedRequest {
  admin: SupabaseClient;
  profile: AppUser;
}

/**
 * Vérifie le JWT Supabase Auth transmis dans l'en-tête Authorization,
 * résout le profil applicatif (public.users) correspondant, et retourne
 * un client service_role (bypass RLS) pour effectuer les écritures.
 * Lève une erreur avec un champ `status` HTTP si l'appelant n'est pas
 * authentifié ou n'a pas de profil applicatif actif.
 */
export async function authorize(req: Request): Promise<AuthorizedRequest> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw Object.assign(new Error('Non authentifié'), { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const jwt = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(jwt);
  if (authError || !user) {
    throw Object.assign(new Error('Session invalide ou expirée'), { status: 401 });
  }

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id, role, organisation_id, actif, deleted_at')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single();

  // 401 (pas 403) sur ces deux cas : ce ne sont pas des refus de permission
  // pour un compte valide, mais une identité qui n'est plus authentifiable
  // (supprimée/désactivée) — le frontend s'appuie sur ce code pour déclencher
  // une déconnexion immédiate (cf. queryClient.ts), à distinguer des vrais 403
  // de rôle/organisation qui ne doivent jamais provoquer de déconnexion.
  if (profileError || !profile) {
    throw Object.assign(new Error('Profil utilisateur introuvable'), { status: 401 });
  }
  if (!profile.actif) {
    throw Object.assign(new Error('Compte désactivé'), { status: 401 });
  }

  // SUPER_ADMIN est un rôle plateforme, jamais bloqué par le statut de sa
  // propre organisation (mêmes bypass que is_admin() côté RLS).
  if (profile.role !== 'SUPER_ADMIN' && profile.organisation_id) {
    const { data: org, error: orgError } = await admin
      .from('organisations')
      .select('statut')
      .eq('id', profile.organisation_id)
      .maybeSingle();
    if (orgError) throw orgError;
    if (org?.statut === 'SUSPENDUE') {
      throw Object.assign(new Error('Votre organisation est suspendue — accès bloqué'), { status: 403 });
    }
  }

  return { admin, profile: profile as AppUser };
}

export function requireRole(profile: AppUser, allowed: string[]): void {
  if (!allowed.includes(profile.role)) {
    throw Object.assign(
      new Error(`Rôle insuffisant — requis : ${allowed.join(', ')}`),
      { status: 403 },
    );
  }
}
