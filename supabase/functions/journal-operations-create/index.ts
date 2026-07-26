import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateJournalOperationBody {
  budgetLigneId: string;
  type: 'RECETTE' | 'DEPENSE' | 'VIREMENT';
  montant: number;
  dateOperation: string;
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

    const body: CreateJournalOperationBody = await req.json();
    if (!body.budgetLigneId) return json({ error: 'budgetLigneId est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);
    if (body.montant === undefined || body.montant === null) {
      return json({ error: 'montant est obligatoire' }, 400);
    }
    if (!body.dateOperation) return json({ error: 'dateOperation est obligatoire' }, 400);

    const { data: ligne, error: ligneError } = await admin
      .from('budget_lignes')
      .select('id, version_id')
      .eq('id', body.budgetLigneId)
      .is('deleted_at', null)
      .maybeSingle();
    if (ligneError) throw ligneError;
    if (!ligne) return json({ error: 'Ligne budgétaire introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('budget_line_organisation_id', {
        p_line_id: body.budgetLigneId,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Cette ligne budgétaire n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: operation, error: insertError } = await admin
      .from('journal_operations')
      .insert({
        id: crypto.randomUUID(),
        budget_ligne_id: body.budgetLigneId,
        type: body.type,
        montant: body.montant,
        date_operation: body.dateOperation,
        reference: body.reference ?? null,
        description: body.description ?? null,
        piece_jointe_id: body.pieceJointeId ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: "Conflit de données sur l'opération de journal" }, 409);
      }
      throw insertError;
    }

    const { data: version } = await admin
      .from('budget_versions')
      .select('project_id')
      .eq('id', ligne.version_id)
      .maybeSingle();

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: version?.project_id ?? null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'journal_operations',
      enregistrement_id: operation.id,
      apres: operation,
      });
    } catch (historiqueError) {
      console.error('[journal-operations-create] historique', historiqueError);
    }

    return json({ data: operation }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[journal-operations-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
