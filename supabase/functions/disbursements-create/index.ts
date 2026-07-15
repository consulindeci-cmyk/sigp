import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateDisbursementBody {
  budgetVersionId?: string;
  budgetLineId?: string;
  contractId?: string;
  fundingSourceId?: string;
  statut?: 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE';
  montant: number;
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

    const body: CreateDisbursementBody = await req.json();
    if (body.montant === undefined || body.montant === null) {
      return json({ error: 'montant est obligatoire' }, 400);
    }

    // Réplique DisbursementService.validateRelations : cohérence croisée
    // entre budgetVersionId / budgetLineId / fundingSourceId, tous facultatifs.
    let budgetVersionProjectId: string | undefined;

    if (body.budgetVersionId) {
      const { data: version, error } = await admin
        .from('budget_versions')
        .select('id, project_id')
        .eq('id', body.budgetVersionId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!version) return json({ error: 'Version budgétaire introuvable' }, 404);
      budgetVersionProjectId = version.project_id;
    }

    if (body.budgetLineId) {
      const { data: line, error } = await admin
        .from('budget_lignes')
        .select('id, version_id')
        .eq('id', body.budgetLineId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!line) return json({ error: 'Ligne budgétaire introuvable' }, 404);
      if (body.budgetVersionId && line.version_id !== body.budgetVersionId) {
        return json(
          { error: "La ligne budgétaire n'appartient pas à la version budgétaire indiquée" },
          409,
        );
      }
    }

    if (body.fundingSourceId) {
      const { data: source, error } = await admin
        .from('funding_sources')
        .select('id, project_id')
        .eq('id', body.fundingSourceId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!source) return json({ error: 'Source de financement introuvable' }, 404);
      if (budgetVersionProjectId && source.project_id !== budgetVersionProjectId) {
        return json(
          { error: "La source de financement n'appartient pas au même projet que la version budgétaire" },
          409,
        );
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

    // Résout l'organisation à partir du premier chemin disponible (mêmes
    // règles que la fonction SQL disbursement_organisation_id, mais avant
    // insertion — la ligne n'existe pas encore).
    if (profile.role !== 'ADMIN') {
      let resolvedOrgId: string | null = null;
      if (body.budgetVersionId) {
        const { data } = await admin.rpc('budget_version_organisation_id', { p_version_id: body.budgetVersionId });
        resolvedOrgId = data ?? null;
      } else if (body.budgetLineId) {
        const { data } = await admin.rpc('budget_line_organisation_id', { p_line_id: body.budgetLineId });
        resolvedOrgId = data ?? null;
      } else if (body.fundingSourceId) {
        const { data } = await admin.rpc('funding_source_organisation_id', { p_funding_source_id: body.fundingSourceId });
        resolvedOrgId = data ?? null;
      } else if (body.contractId) {
        const { data: contract } = await admin.from('contracts').select('project_id').eq('id', body.contractId).maybeSingle();
        if (contract?.project_id) {
          const { data } = await admin.rpc('project_organisation_id', { p_project_id: contract.project_id });
          resolvedOrgId = data ?? null;
        }
      }
      // Aucune référence fournie : pas de moyen de rattacher à une organisation
      // → réservé à ADMIN, même traitement que les entités orphelines.
      if (!resolvedOrgId || resolvedOrgId !== profile.organisation_id) {
        return json({ error: "Ce décaissement n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: disbursement, error: insertError } = await admin
      .from('disbursements')
      .insert({
        id: crypto.randomUUID(),
        budget_version_id: body.budgetVersionId ?? null,
        budget_ligne_id: body.budgetLineId ?? null,
        contract_id: body.contractId ?? null,
        funding_source_id: body.fundingSourceId ?? null,
        statut: body.statut ?? 'PLANIFIE',
        montant: body.montant,
        date_prevue: body.datePrevue ?? null,
        date_reelle: body.dateReelle ?? null,
        reference: body.reference ?? null,
        description: body.description ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur le décaissement' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: budgetVersionProjectId ?? null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'disbursements',
      enregistrement_id: disbursement.id,
      apres: disbursement,
    });

    return json({ data: disbursement }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[disbursements-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
