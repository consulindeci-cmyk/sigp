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

  if (profileError || !profile) {
    throw Object.assign(new Error('Profil utilisateur introuvable'), { status: 403 });
  }
  if (!profile.actif) {
    throw Object.assign(new Error('Compte désactivé'), { status: 403 });
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
