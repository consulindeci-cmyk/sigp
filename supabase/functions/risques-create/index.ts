import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import { computeNiveauCriticite } from '../_shared/risk-scoring.ts';

interface CreateRisqueBody {
  projectId: string;
  wbsId?: string;
  code?: string;
  description: string;
  categorie?: string;
  probabilite: 'FAIBLE' | 'POSSIBLE' | 'PROBABLE' | 'QUASI_CERTAIN';
  impact: 'FAIBLE' | 'MODERE' | 'IMPORTANT' | 'CRITIQUE';
  statut?: string;
  strategie?: string;
  planAction?: string;
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

    const body: CreateRisqueBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.description?.trim()) return json({ error: 'description est obligatoire' }, 400);
    if (!body.probabilite || !body.impact) {
      return json({ error: 'probabilite et impact sont obligatoires' }, 400);
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

    const niveauCriticite = computeNiveauCriticite(body.probabilite, body.impact);

    const { data: risque, error: insertError } = await admin
      .from('risques')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        wbs_id: body.wbsId ?? null,
        code: body.code ?? null,
        description: body.description.trim(),
        categorie: body.categorie ?? null,
        probabilite: body.probabilite,
        impact: body.impact,
        niveau_criticite: niveauCriticite,
        statut: body.statut ?? 'OUVERT',
        strategie: body.strategie ?? null,
        plan_action: body.planAction ?? null,
        responsable_id: body.responsableId ?? null,
        date_detection: body.dateDetection ?? null,
        date_echeance: body.dateEcheance ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'risques',
      enregistrement_id: risque.id,
      apres: risque,
    });

    // NOTE : NestJS émettait ici RISQUE_CREATED + RISK_CRITICAL_DETECTED
    // (niveauCriticite === 'CRITIQUE') pour déclencher des notifications.
    // Reporté à la migration du module Notifications (Phase 2) — pas encore
    // câblé ici, le risque est bien créé mais ne notifie personne pour l'instant.

    return json({ data: risque }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[risques-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
