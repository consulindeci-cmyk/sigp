import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateDisbursementBody {
  id: string;
  contractId?: string;
  statut?: 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE';
  montant?: number;
  datePrevue?: string;
  dateReelle?: string;
  reference?: string;
  description?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN']);

    const body: UpdateDisbursementBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('disbursements')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Décaissement introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('disbursement_organisation_id', {
        p_disbursement_id: body.id,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce décaissement n'appartient pas à votre organisation" }, 403);
      }
    }

    if (body.contractId) {
      const { data: contract, error } = await admin
        .from('contracts')
        .select('id')
        .eq('id', body.contractId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!contract) return json({ error: 'Contrat introuvable' }, 404);
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.contractId !== undefined) updatePayload.contract_id = body.contractId;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.montant !== undefined) updatePayload.montant = body.montant;
    if (body.datePrevue !== undefined) updatePayload.date_prevue = body.datePrevue;
    if (body.dateReelle !== undefined) updatePayload.date_reelle = body.dateReelle;
    if (body.reference !== undefined) updatePayload.reference = body.reference;
    if (body.description !== undefined) updatePayload.description = body.description;

    const { data: updated, error: updateError } = await admin
      .from('disbursements')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur le décaissement' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'disbursements',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[disbursements-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
