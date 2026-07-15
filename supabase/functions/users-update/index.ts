import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Champs modifiables uniquement : nom, prénom, téléphone, rôle, statut (actif).
// id, email, password ne sont volontairement PAS exposés (réplique UpdateUserDto).
interface UpdateUserBody {
  id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER';
  actif?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN']);

    const body: UpdateUserBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('users')
      .select('id, nom, prenom, email, role, actif, telephone, organisation_id')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Utilisateur introuvable' }, 404);

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.prenom !== undefined) updatePayload.prenom = body.prenom.trim();
    if (body.telephone !== undefined) updatePayload.telephone = body.telephone?.trim() ?? null;
    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.actif !== undefined) updatePayload.actif = body.actif;

    const { data: updated, error: updateError } = await admin
      .from('users')
      .update(updatePayload)
      .eq('id', body.id)
      .select('id, nom, prenom, email, role, actif, telephone, organisation_id')
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'users',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[users-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
