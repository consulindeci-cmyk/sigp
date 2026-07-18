// URL du frontend déployé — sert de base à redirectTo pour les invitations
// Supabase Auth (inviteUserByEmail). Sans ce paramètre, Supabase retombe sur
// la Site URL par défaut du projet et l'utilisateur invité atterrit connecté
// dans l'app sans être jamais passé par l'écran de définition du mot de
// passe : aucun mot de passe n'est alors défini, et il ne peut plus se
// reconnecter après déconnexion. Surchargeable via le secret FRONTEND_URL
// (supabase secrets set FRONTEND_URL=...) sans redéploiement du code.
export const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'https://sigp-frontend-delta.vercel.app';

export const INVITE_REDIRECT_TO = `${FRONTEND_URL}/reset-password`;
