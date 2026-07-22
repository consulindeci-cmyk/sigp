import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdatePtbaActiviteBody {
  id: string;
  wbsId?: string;
  logframeIndicatorId?: string;
  libelle?: string;
  description?: string;
  statut?: 'NON_DEMARRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_RETARD';
  annee?: number;
  trimestres?: number[];
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

    const body: UpdatePtbaActiviteBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);
    if (body.trimestres !== undefined) {
      if (!Array.isArray(body.trimestres) || body.trimestres.length === 0) {
        return json({ error: 'trimestres doit contenir au moins un trimestre' }, 400);
      }
      if (body.trimestres.some(t => !Number.isInteger(t) || t < 1 || t > 4)) {
        return json({ error: 'Chaque trimestre doit être un entier compris entre 1 et 4' }, 400);
      }
      if (new Set(body.trimestres).size !== body.trimestres.length) {
        return json({ error: 'Un trimestre ne peut pas être sélectionné plusieurs fois' }, 400);
      }
    }
    // taux_realisation alimente directement calculate_project_evm() (EV du
    // projet entier) — une valeur hors [0,100] fausse silencieusement tout
    // l'EVM/SPI/CPI affichés sur le dashboard et l'onglet EVM.
    if (body.tauxRealisation !== undefined && (body.tauxRealisation < 0 || body.tauxRealisation > 100)) {
      return json({ error: 'tauxRealisation doit être compris entre 0 et 100' }, 400);
    }
    if (body.montantPrevu !== undefined && body.montantPrevu < 0) {
      return json({ error: 'montantPrevu doit être supérieur ou égal à 0' }, 400);
    }
    if (body.montantRealise !== undefined && body.montantRealise < 0) {
      return json({ error: 'montantRealise doit être supérieur ou égal à 0' }, 400);
    }

    const { data: existing, error: findError } = await admin
      .from('ptba_activites')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Activité PTBA introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette activité n'appartient pas à votre organisation" }, 403);
      }
    }

    // Les rattachements restent cohérents avec le projet de l'activité (réplique PtbaService.validateLinks).
    if (body.wbsId) {
      const { data: wbs, error: wbsError } = await admin
        .from('wbs_nodes')
        .select('id, project_id')
        .eq('id', body.wbsId)
        .is('deleted_at', null)
        .maybeSingle();
      if (wbsError) throw wbsError;
      if (!wbs) return json({ error: 'Nœud WBS introuvable' }, 404);
      if (wbs.project_id !== existing.project_id) {
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
      if (objective.project_id !== existing.project_id) {
        return json({ error: "L'objectif de l'indicateur appartient à un autre projet" }, 409);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.wbsId !== undefined) updatePayload.wbs_id = body.wbsId;
    if (body.logframeIndicatorId !== undefined) updatePayload.logframe_ref_id = body.logframeIndicatorId;
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.description !== undefined) updatePayload.description = body.description?.trim() ?? null;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.annee !== undefined) updatePayload.annee = body.annee;
    if (body.trimestres !== undefined) updatePayload.trimestres = body.trimestres;
    if (body.responsableId !== undefined) updatePayload.responsable_id = body.responsableId;
    if (body.dateDebutPrevue !== undefined) updatePayload.date_debut_prevue = body.dateDebutPrevue;
    if (body.dateFinPrevue !== undefined) updatePayload.date_fin_prevue = body.dateFinPrevue;
    if (body.dateDebutReelle !== undefined) updatePayload.date_debut_reelle = body.dateDebutReelle;
    if (body.dateFinReelle !== undefined) updatePayload.date_fin_reelle = body.dateFinReelle;
    if (body.montantPrevu !== undefined) updatePayload.montant_prevu = body.montantPrevu;
    if (body.montantRealise !== undefined) updatePayload.montant_realise = body.montantRealise;
    if (body.tauxRealisation !== undefined) updatePayload.taux_realisation = body.tauxRealisation;

    const { data: updated, error: updateError } = await admin
      .from('ptba_activites')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur l’activité PTBA' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'ptba_activites',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ptba-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
