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
    // TOUTES les Edge Functions : un compte supprimé ne peut plus s'authentifier
    // même si son compte Supabase Auth reste techniquement actif.
    const { error: deleteError } = await admin
      .from('users')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

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

    return json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
