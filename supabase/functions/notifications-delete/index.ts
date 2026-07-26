import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteNotificationBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteNotificationBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('notifications')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Notification introuvable' }, 404);

    // requireRole ci-dessus limite déjà l'appelant à ADMIN/SUPER_ADMIN — reste
    // à vérifier que le destinataire appartient bien à l'organisation de
    // l'org_admin (SUPER_ADMIN n'a aucune restriction).
    if (profile.role !== 'SUPER_ADMIN') {
      const { data: owner, error: ownerError } = await admin
        .from('users')
        .select('organisation_id')
        .eq('id', existing.user_id)
        .maybeSingle();
      if (ownerError) throw ownerError;
      if (!owner || owner.organisation_id !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette notification n'appartient pas à votre organisation" }, 403);
      }
    }

    const { error: deleteError } = await admin
      .from('notifications')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'notifications',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[notifications-delete] historique', historiqueError);
    }

    return json({ message: 'Notification supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[notifications-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
