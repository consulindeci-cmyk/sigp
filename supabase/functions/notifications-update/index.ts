import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';

interface UpdateNotificationBody {
  id: string;
  lue?: boolean;
  titre?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Pas de requireRole ici : tout rôle peut marquer SES PROPRES
    // notifications comme lues — seul le rattachement à soi-même (ou ADMIN)
    // est vérifié ci-dessous, pas le rôle.

    const body: UpdateNotificationBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('notifications')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Notification introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN' && existing.user_id !== profile.id) {
      if (profile.role !== 'ADMIN') {
        return json({ error: "Accès refusé : ce n'est pas votre notification" }, 403);
      }
      const { data: owner, error: ownerError } = await admin
        .from('users')
        .select('organisation_id')
        .eq('id', existing.user_id)
        .maybeSingle();
      if (ownerError) throw ownerError;
      if (!owner || owner.organisation_id !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce n'est pas votre notification" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.lue !== undefined) updatePayload.lue = body.lue;
    if (body.titre !== undefined) updatePayload.titre = body.titre.trim();
    if (body.message !== undefined) updatePayload.message = body.message.trim();

    const { data: updated, error: updateError } = await admin
      .from('notifications')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'notifications',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[notifications-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
