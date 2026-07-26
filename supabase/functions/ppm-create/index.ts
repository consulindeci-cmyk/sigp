import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreatePpmMarcheBody {
  projectId: string;
  code: string;
  intitule: string;
  type: 'FOURNITURES' | 'TRAVAUX' | 'SERVICES' | 'CONSULTANTS';
  montantEstime?: number;
  dateLancementPrevu?: string;
  dateSoumissionPrevu?: string;
  dateAttribution?: string;
  dateSignature?: string;
  dateFinPrevue?: string;
  notes?: string;
  // Rattachement WBS/Budget + méthode/revue — colonnes dédiées (cf. migration
  // 20260828100000), remplacent le JSON __PPM_META__ auparavant planqué dans
  // `notes`.
  wbsId?: string;
  budgetLigneId?: string;
  methode?: string;
  typeRevue?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreatePpmMarcheBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.code?.trim()) return json({ error: 'code est obligatoire' }, 400);
    if (!body.intitule?.trim()) return json({ error: 'intitule est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);

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

    // Rattachements optionnels : cohérence de projet (même règle que
    // budget-lines-create pour wbsId).
    if (body.wbsId) {
      const { data: wbs, error: wbsError } = await admin
        .from('wbs_nodes')
        .select('id, project_id')
        .eq('id', body.wbsId)
        .is('deleted_at', null)
        .maybeSingle();
      if (wbsError) throw wbsError;
      if (!wbs) return json({ error: 'Nœud WBS introuvable' }, 404);
      if (wbs.project_id !== body.projectId) {
        return json({ error: 'Le nœud WBS appartient à un autre projet' }, 409);
      }
    }

    if (body.budgetLigneId) {
      const { data: ligne, error: ligneError } = await admin
        .from('budget_lignes')
        .select('id, version_id')
        .eq('id', body.budgetLigneId)
        .is('deleted_at', null)
        .maybeSingle();
      if (ligneError) throw ligneError;
      if (!ligne) return json({ error: 'Ligne budgétaire introuvable' }, 404);

      const { data: ligneVersion, error: ligneVersionError } = await admin
        .from('budget_versions')
        .select('project_id')
        .eq('id', ligne.version_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (ligneVersionError) throw ligneVersionError;
      if (!ligneVersion || ligneVersion.project_id !== body.projectId) {
        return json({ error: 'La ligne budgétaire appartient à un autre projet' }, 409);
      }
    }

    const { data: marche, error: insertError } = await admin
      .from('ppm_marches')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        code: body.code.trim(),
        intitule: body.intitule.trim(),
        type: body.type,
        // Suivi d'exécution (statut/titulaire/montant signé/date fin
        // effective) n'est plus géré par ce module — statut reste écrit avec
        // une valeur fixe (colonne sans défaut DB réel) mais n'est plus
        // pilotable depuis la création du marché.
        statut: 'EN_PREPARATION',
        montant_estime: body.montantEstime ?? null,
        date_lancement_prevu: body.dateLancementPrevu ?? null,
        date_soumission_prevu: body.dateSoumissionPrevu ?? null,
        date_attribution: body.dateAttribution ?? null,
        date_signature: body.dateSignature ?? null,
        date_fin_prevue: body.dateFinPrevue ?? null,
        notes: body.notes ?? null,
        wbs_id: body.wbsId ?? null,
        budget_ligne_id: body.budgetLigneId ?? null,
        methode: body.methode ?? null,
        type_revue: body.typeRevue ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Ce code marché existe déjà dans ce projet' }, 409);
      }
      throw insertError;
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'ppm_marches',
      enregistrement_id: marche.id,
      apres: marche,
      });
    } catch (historiqueError) {
      console.error('[ppm-create] historique', historiqueError);
    }

    return json({ data: marche }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
