import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import { computeNiveauCriticite } from '../_shared/risk-scoring.ts';

interface UpdateRisqueBody {
  id: string;
  wbsId?: string;
  code?: string;
  description?: string;
  categorie?: string;
  // Matrice 3×3 stricte : '1' | '2' | '3' (cf. _shared/risk-scoring.ts).
  probabilite?: string;
  impact?: string;
  statut?: string;
  // Stratégie d'atténuation — champ texte libre (remplace l'ancienne liste
  // fermée Éviter/Réduire/Transférer/Accepter). plan_action (planAction)
  // n'est plus alimenté depuis ce champ, cf. suppression de plan_mitigation
  // côté frontend.
  strategie?: string;
  responsableId?: string;
  dateDetection?: string;
  dateEcheance?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateRisqueBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('risques')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Risque introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce risque n'appartient pas à votre organisation" }, 403);
      }
    }

    const effProb = body.probabilite ?? existing.probabilite;
    const effImpact = body.impact ?? existing.impact;
    const niveauCriticite = computeNiveauCriticite(effProb, effImpact);

    const updatePayload: Record<string, unknown> = {
      niveau_criticite: niveauCriticite,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.wbsId !== undefined) updatePayload.wbs_id = body.wbsId;
    if (body.code !== undefined) updatePayload.code = body.code;
    if (body.description !== undefined) updatePayload.description = body.description.trim();
    if (body.categorie !== undefined) updatePayload.categorie = body.categorie;
    if (body.probabilite !== undefined) updatePayload.probabilite = body.probabilite;
    if (body.impact !== undefined) updatePayload.impact = body.impact;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.strategie !== undefined) updatePayload.strategie = body.strategie;
    if (body.responsableId !== undefined) updatePayload.responsable_id = body.responsableId;
    if (body.dateDetection !== undefined) updatePayload.date_detection = body.dateDetection;
    if (body.dateEcheance !== undefined) updatePayload.date_echeance = body.dateEcheance;

    const { data: updated, error: updateError } = await admin
      .from('risques')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'risques',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    // Notifie seulement la TRANSITION vers ELEVE (palier haut du nouveau
    // modèle 3×3, remplace CRITIQUE) — pas à chaque modification d'un risque
    // déjà élevé, pour ne pas spammer. Même logique que risques-create.
    if (niveauCriticite === 'ELEVE' && existing.niveau_criticite !== 'ELEVE') {
      try {
        const notifyUserIds = new Set<string>();
        const effResponsableId = body.responsableId !== undefined ? body.responsableId : existing.responsable_id;
        if (effResponsableId) notifyUserIds.add(effResponsableId);
        const { data: projectRow } = await admin
          .from('projects').select('manager_id').eq('id', existing.project_id).maybeSingle();
        if (projectRow?.manager_id) notifyUserIds.add(projectRow.manager_id);

        for (const uid of notifyUserIds) {
          await admin.from('notifications').insert({
            id: crypto.randomUUID(),
            user_id: uid,
            project_id: existing.project_id,
            type: 'RISQUE_CRITIQUE',
            titre: 'Risque devenu élevé',
            message: `Un risque est passé au niveau élevé : ${updated.description}`,
            lue: false,
            data: { risqueId: updated.id },
            created_by: profile.id,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (notifError) {
        console.error('[risques-update] notification RISQUE_CRITIQUE', notifError);
      }
    }

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[risques-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
