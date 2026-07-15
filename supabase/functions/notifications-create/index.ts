import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

type TypeNotification =
  | 'RISQUE_CRITIQUE' | 'LIVRABLE_EN_RETARD' | 'BUDGET_DEPASSE' | 'EVM_ALERTE_CPI'
  | 'EVM_ALERTE_SPI' | 'DOCUMENT_VALIDE' | 'RAPPORT_PRET' | 'MENTION_COMMENTAIRE'
  | 'PROJET_STATUT_CHANGE' | 'BUDGET_VALIDE' | 'CONTRAT_EXPIRE' | 'PAIEMENT_DU'
  | 'INVITATION_PROJET';

interface CreateNotificationBody {
  userId: string;
  projectId?: string;
  type: TypeNotification;
  titre: string;
  message: string;
  data?: Record<string, unknown>;
  expiresAt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN']);

    const body: CreateNotificationBody = await req.json();
    if (!body.userId) return json({ error: 'userId est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);
    if (!body.titre?.trim()) return json({ error: 'titre est obligatoire' }, 400);
    if (!body.message?.trim()) return json({ error: 'message est obligatoire' }, 400);

    const { data: targetUser, error: userError } = await admin
      .from('users')
      .select('id, organisation_id')
      .eq('id', body.userId)
      .maybeSingle();
    if (userError) throw userError;
    if (!targetUser) return json({ error: 'Utilisateur introuvable' }, 404);

    if (profile.role !== 'ADMIN' && targetUser.organisation_id !== profile.organisation_id) {
      return json({ error: "Vous ne pouvez notifier qu'un utilisateur de votre organisation" }, 403);
    }

    const { data: notification, error: insertError } = await admin
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: body.userId,
        project_id: body.projectId ?? null,
        type: body.type,
        titre: body.titre.trim(),
        message: body.message.trim(),
        lue: false,
        data: body.data ?? null,
        expires_at: body.expiresAt ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId ?? null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'notifications',
      enregistrement_id: notification.id,
      apres: notification,
    });

    return json({ data: notification }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[notifications-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
