import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateDisbursementBody {
  budgetVersionId?: string;
  budgetLineId?: string;
  montant: number;
  devise?: string;
  // Date unique du décaissement (simplification : plus de distinction
  // prévue/réelle ni de statut de workflow — un décaissement créé
  // représente directement un paiement effectué). Écrite dans les deux
  // colonnes réelles date_prevue/date_reelle pour ne pas nécessiter de
  // migration de schéma.
  date?: string;
  reference?: string;
  description?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateDisbursementBody = await req.json();
    if (body.montant === undefined || body.montant === null) {
      return json({ error: 'montant est obligatoire' }, 400);
    }
    // Ligne Budgétaire désormais obligatoire (Source de financement/Contrat
    // retirés du formulaire) — c'est le seul chemin restant pour résoudre
    // l'organisation et déclencher recalc_budget_ligne_montants.
    if (!body.budgetLineId) {
      return json({ error: 'budgetLineId est obligatoire' }, 400);
    }

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

    const { data: line, error: lineError } = await admin
      .from('budget_lignes')
      .select('id, version_id')
      .eq('id', body.budgetLineId)
      .is('deleted_at', null)
      .maybeSingle();
    if (lineError) throw lineError;
    if (!line) return json({ error: 'Ligne budgétaire introuvable' }, 404);
    if (body.budgetVersionId && line.version_id !== body.budgetVersionId) {
      return json(
        { error: "La ligne budgétaire n'appartient pas à la version budgétaire indiquée" },
        409,
      );
    }
    if (!budgetVersionProjectId) {
      const { data: version, error: versionError } = await admin
        .from('budget_versions')
        .select('project_id')
        .eq('id', line.version_id)
        .maybeSingle();
      if (versionError) throw versionError;
      budgetVersionProjectId = version?.project_id ?? undefined;
    }

    // Résout l'organisation à partir du premier chemin disponible (mêmes
    // règles que la fonction SQL disbursement_organisation_id, mais avant
    // insertion — la ligne n'existe pas encore).
    if (profile.role !== 'SUPER_ADMIN') {
      let resolvedOrgId: string | null = null;
      if (body.budgetVersionId) {
        const { data } = await admin.rpc('budget_version_organisation_id', { p_version_id: body.budgetVersionId });
        resolvedOrgId = data ?? null;
      } else {
        const { data } = await admin.rpc('budget_line_organisation_id', { p_line_id: body.budgetLineId });
        resolvedOrgId = data ?? null;
      }
      if (!resolvedOrgId || resolvedOrgId !== profile.organisation_id) {
        return json({ error: "Ce décaissement n'appartient pas à votre organisation" }, 403);
      }
    }

    // Devise par défaut = devise_defaut de l'organisation du projet résolu ;
    // repli XOF si aucun projet n'a pu être résolu.
    let devise = body.devise;
    if (!devise && budgetVersionProjectId) {
      const { data: orgDevise } = await admin.rpc('project_devise_defaut', { p_project_id: budgetVersionProjectId });
      devise = orgDevise ?? undefined;
    }
    devise = devise ?? 'XOF';

    const { data: disbursement, error: insertError } = await admin
      .from('disbursements')
      .insert({
        id: crypto.randomUUID(),
        budget_version_id: body.budgetVersionId ?? null,
        budget_ligne_id: body.budgetLineId,
        // Statut/Source de financement/Contrat retirés du formulaire et des
        // payloads (cf. simplification) — un décaissement créé représente
        // directement un paiement effectué : statut fixé à 'DECAISSE' (non
        // client-contrôlable), condition requise par
        // recalc_budget_ligne_montants pour compter ce montant dans
        // montant_paye (sinon l'AC de l'EVM et la colonne "Décaissé" du
        // Budget restent figés à zéro).
        statut: 'DECAISSE',
        montant: body.montant,
        devise,
        date_prevue: body.date ?? null,
        date_reelle: body.date ?? null,
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

    // Recalcul immédiat de la ligne budgétaire liée (montant_paye) — pas
    // d'attente d'un batch : la ligne doit refléter les vraies transactions
    // dès leur enregistrement (cf. audit : risque de désynchronisation).
    if (disbursement.budget_ligne_id) {
      const { error: recalcError } = await admin.rpc('recalc_budget_ligne_montants', {
        p_budget_ligne_id: disbursement.budget_ligne_id,
      });
      if (recalcError) console.error('[disbursements-create] recalc_budget_ligne_montants', recalcError);
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: budgetVersionProjectId ?? null,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'disbursements',
      enregistrement_id: disbursement.id,
      apres: disbursement,
      });
    } catch (historiqueError) {
      console.error('[disbursements-create] historique', historiqueError);
    }

    return json({ data: disbursement }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[disbursements-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
