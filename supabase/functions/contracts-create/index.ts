import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateContractBody {
  projectId: string;
  marcheId?: string;
  budgetLigneId?: string;
  numero: string;
  intitule: string;
  type?: 'MARCHE' | 'CONVENTION' | 'PROTOCOLE' | 'LETTRE_ACCORD';
  statut?: 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE';
  titulaire: string;
  montant: number;
  devise?: string;
  dateSignature?: string;
  dateDebut?: string;
  dateFin?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateContractBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.numero?.trim()) return json({ error: 'numero est obligatoire' }, 400);
    if (!body.intitule?.trim()) return json({ error: 'intitule est obligatoire' }, 400);
    if (!body.titulaire?.trim()) return json({ error: 'titulaire est obligatoire' }, 400);
    if (body.montant === undefined || body.montant === null) {
      return json({ error: 'montant est obligatoire' }, 400);
    }

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    if (body.budgetLigneId) {
      const { data: ligne, error: ligneError } = await admin
        .from('budget_lignes')
        .select('id, version:budget_versions!inner(project_id)')
        .eq('id', body.budgetLigneId)
        .is('deleted_at', null)
        .maybeSingle();
      if (ligneError) throw ligneError;
      if (!ligne) return json({ error: 'Ligne budgétaire introuvable' }, 404);
      const ligneProjectId = Array.isArray(ligne.version) ? ligne.version[0]?.project_id : ligne.version?.project_id;
      if (ligneProjectId !== body.projectId) {
        return json({ error: "Cette ligne budgétaire n'appartient pas au même projet" }, 409);
      }
    }

    // Devise par défaut = devise_defaut de l'organisation du projet.
    let devise = body.devise;
    if (!devise) {
      const { data: orgDevise } = await admin.rpc('project_devise_defaut', { p_project_id: body.projectId });
      devise = orgDevise ?? 'XOF';
    }

    const { data: contract, error: insertError } = await admin
      .from('contracts')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        marche_id: body.marcheId ?? null,
        budget_ligne_id: body.budgetLigneId ?? null,
        numero: body.numero.trim(),
        intitule: body.intitule.trim(),
        type: body.type ?? 'MARCHE',
        statut: body.statut ?? 'ACTIF',
        titulaire: body.titulaire.trim(),
        montant: body.montant,
        devise,
        date_signature: body.dateSignature ?? null,
        date_debut: body.dateDebut ?? null,
        date_fin: body.dateFin ?? null,
        notes: body.notes ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur le contrat' }, 409);
      }
      throw insertError;
    }

    // Un nouveau contrat engagé (statut ≠ RESILIE) impacte immédiatement
    // montant_engage de la ligne budgétaire liée.
    if (contract.budget_ligne_id) {
      const { error: recalcError } = await admin.rpc('recalc_budget_ligne_montants', {
        p_budget_ligne_id: contract.budget_ligne_id,
      });
      if (recalcError) console.error('[contracts-create] recalc_budget_ligne_montants', recalcError);
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'contracts',
      enregistrement_id: contract.id,
      apres: contract,
      });
    } catch (historiqueError) {
      console.error('[contracts-create] historique', historiqueError);
    }

    return json({ data: contract }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[contracts-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
