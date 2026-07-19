import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreatePtbaActiviteBody {
  projectId: string;
  code: string;
  libelle: string;
  description?: string;
  statut?: 'NON_DEMARRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_RETARD';
  annee: number;
  trimestre: number;
  wbsId?: string;
  logframeIndicatorId?: string;
  responsableId?: string;
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  dateDebutReelle?: string;
  dateFinReelle?: string;
  montantPrevu?: number;
  montantRealise?: number;
  tauxRealisation?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreatePtbaActiviteBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.code?.trim()) return json({ error: 'code est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);
    if (body.annee === undefined) return json({ error: 'annee est obligatoire' }, 400);
    if (body.trimestre === undefined) return json({ error: 'trimestre est obligatoire' }, 400);
    if (body.trimestre < 1 || body.trimestre > 4) {
      return json({ error: 'trimestre doit être compris entre 1 et 4' }, 400);
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

    // Rattachements optionnels : réplique PtbaService.validateLinks.
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

    if (body.logframeIndicatorId) {
      const { data: indicator, error: indicatorError } = await admin
        .from('logframe_indicators')
        .select('id, objective_id')
        .eq('id', body.logframeIndicatorId)
        .is('deleted_at', null)
        .maybeSingle();
      if (indicatorError) throw indicatorError;
      if (!indicator) return json({ error: 'Indicateur introuvable' }, 404);

      const { data: objective, error: objError } = await admin
        .from('logframe_objectives')
        .select('id, project_id')
        .eq('id', indicator.objective_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (objError) throw objError;
      if (!objective) return json({ error: 'Objectif introuvable' }, 404);
      if (objective.project_id !== body.projectId) {
        return json({ error: "L'objectif de l'indicateur appartient à un autre projet" }, 409);
      }
    }

    const { data: activite, error: insertError } = await admin
      .from('ptba_activites')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        wbs_id: body.wbsId ?? null,
        logframe_ref_id: body.logframeIndicatorId ?? null,
        code: body.code.trim().toUpperCase(),
        libelle: body.libelle.trim(),
        description: body.description?.trim() ?? null,
        statut: body.statut ?? 'NON_DEMARRE',
        annee: body.annee,
        trimestre: body.trimestre,
        responsable_id: body.responsableId ?? null,
        date_debut_prevue: body.dateDebutPrevue ?? null,
        date_fin_prevue: body.dateFinPrevue ?? null,
        date_debut_reelle: body.dateDebutReelle ?? null,
        date_fin_reelle: body.dateFinReelle ?? null,
        montant_prevu: body.montantPrevu ?? null,
        montant_realise: body.montantRealise ?? null,
        taux_realisation: body.tauxRealisation ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur l’activité PTBA' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'ptba_activites',
      enregistrement_id: activite.id,
      apres: activite,
    });

    return json({ data: activite }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ptba-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
