import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteUserBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);

    const body: DeleteUserBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    // Un utilisateur peut supprimer son propre compte ("Zone dangereuse") ;
    // supprimer un AUTRE utilisateur reste réservé à ADMIN (page Utilisateurs).
    if (body.id !== profile.id) {
      requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);
    }

    const { data: existing, error: findError } = await admin
      .from('users')
      .select('id, nom, prenom, email, role, actif, auth_user_id, organisation_id')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Utilisateur introuvable' }, 404);

    // org_admin ne peut supprimer que des utilisateurs de sa propre organisation.
    if (body.id !== profile.id && profile.role !== 'SUPER_ADMIN' && existing.organisation_id !== profile.organisation_id) {
      return json({ error: "Accès refusé : cet utilisateur n'appartient pas à votre organisation" }, 403);
    }

    // Soft delete du profil — réplique UsersRepository.softDelete() (jamais
    // de suppression physique). deleted_at est vérifié par authorize() sur
    // TOUTES les Edge Functions, ET indispensable ici : login_history/comments/
    // historique/gouvernance référencent users(id) sans ON DELETE CASCADE — une
    // suppression physique de public.users échouerait (violation FK) pour tout
    // utilisateur ayant déjà été connecté ou ayant produit un enregistrement.
    const { error: deleteError } = await admin
      .from('users')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    // Suppression physique du compte Supabase Auth — c'était l'étape manuelle
    // (dashboard Supabase) qu'il fallait éliminer. Faite APRÈS le soft delete
    // du profil applicatif : si elle échoue (ex. déjà purgé côté Auth), l'accès
    // reste bloqué dans tous les cas via deleted_at, donc pas de rollback ni
    // d'échec de la requête pour un problème non bloquant côté Auth.
    // Note révocation de session : il n'existe pas d'API "admin.auth.signOut(userId)"
    // dans supabase-js — signOut(jwt, scope) exige le JWT vivant de la session à
    // révoquer, qu'on n'a pas ici (on n'a que l'id). deleteUser() ci-dessous
    // invalide déjà les refresh tokens (plus moyen d'obtenir un nouvel access
    // token), mais un access token déjà émis et non expiré resterait
    // techniquement valide pour PostgREST (qui ne revérifie pas auth.users par
    // requête) jusqu'à son expiration naturelle. C'est fermé côté RLS, pas ici :
    // cf. migration 20260816100000_rls_helpers_exclude_deleted_users.sql, qui
    // fait retourner NULL/false à current_user_role()/is_admin()/
    // current_user_organisation_id() dès que deleted_at est renseigné — l'accès
    // aux données est donc coupé immédiatement, quel que soit l'état du token.
    if (existing.auth_user_id) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(existing.auth_user_id);
      if (authDeleteError) {
        console.error('[users-delete] échec suppression auth.users (profil déjà désactivé) :', authDeleteError);
      }
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      organisation_id: existing.organisation_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'users',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[users-delete] historique', historiqueError);
    }

    return json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
