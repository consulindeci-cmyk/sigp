import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateJournalOperationBody {
  id: string;
  type?: 'RECETTE' | 'DEPENSE' | 'VIREMENT';
  montant?: number;
  dateOperation?: string;
  reference?: string;
  description?: string;
  pieceJointeId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateJournalOperationBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('journal_operations')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Opération de journal introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('budget_line_organisation_id', {
        p_line_id: existing.budget_ligne_id,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette opération n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.montant !== undefined) updatePayload.montant = body.montant;
    if (body.dateOperation !== undefined) updatePayload.date_operation = body.dateOperation;
    if (body.reference !== undefined) updatePayload.reference = body.reference;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.pieceJointeId !== undefined) updatePayload.piece_jointe_id = body.pieceJointeId;

    const { data: updated, error: updateError } = await admin
      .from('journal_operations')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: "Conflit de données sur l'opération de journal" }, 409);
      }
      throw updateError;
    }

    const { data: ligne } = await admin
      .from('budget_lignes')
      .select('version_id')
      .eq('id', existing.budget_ligne_id)
      .maybeSingle();
    const { data: version } = ligne
      ? await admin.from('budget_versions').select('project_id').eq('id', ligne.version_id).maybeSingle()
      : { data: null };

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: version?.project_id ?? null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'journal_operations',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[journal-operations-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
