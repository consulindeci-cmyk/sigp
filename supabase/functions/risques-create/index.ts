import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import { computeNiveauCriticite } from '../_shared/risk-scoring.ts';

interface CreateRisqueBody {
  projectId: string;
  wbsId?: string;
  code?: string;
  description: string;
  categorie?: string;
  // Matrice 3×3 stricte : '1' | '2' | '3' (cf. _shared/risk-scoring.ts).
  probabilite: string;
  impact: string;
  statut?: string;
  // Stratégie d'atténuation — champ texte libre (remplace l'ancienne liste
  // fermée Éviter/Réduire/Transférer/Accepter). plan_action n'est plus
  // alimenté depuis ce champ, cf. suppression de plan_mitigation côté
  // frontend.
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
        responsable_id: body.responsableId ?? null,
        date_detection: body.dateDetection ?? null,
        date_echeance: body.dateEcheance ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'risques',
      enregistrement_id: risque.id,
      apres: risque,
      });
    } catch (historiqueError) {
      console.error('[risques-create] historique', historiqueError);
    }

    // Premier pont vers le module Notifications (cf. audit Risques & Alertes :
    // notifications-create n'était jamais appelé par aucun code du repo — la
    // cloche restait structurellement vide). Insertion directe via le client
    // service_role déjà disponible ici plutôt qu'un appel HTTP imbriqué vers
    // notifications-create (évite une ré-authentification fragile pour un
    // effet secondaire non bloquant). Notifie le responsable du risque et le
    // manager du projet — pas encore une diffusion large à tout le rôle
    // COORDINATEUR/CHARGE_PROGRAMME de l'organisation (hors périmètre de ce
    // premier câblage). ELEVE est le palier haut du modèle 3×3 (remplace
    // l'ancien CRITIQUE).
    if (niveauCriticite === 'ELEVE') {
      try {
        const notifyUserIds = new Set<string>();
        if (body.responsableId) notifyUserIds.add(body.responsableId);
        const { data: projectRow } = await admin
          .from('projects').select('manager_id').eq('id', body.projectId).maybeSingle();
        if (projectRow?.manager_id) notifyUserIds.add(projectRow.manager_id);

        for (const uid of notifyUserIds) {
          await admin.from('notifications').insert({
            id: crypto.randomUUID(),
            user_id: uid,
            project_id: body.projectId,
            type: 'RISQUE_CRITIQUE',
            titre: 'Nouveau risque élevé',
            message: `Un risque élevé a été enregistré : ${risque.description}`,
            lue: false,
            data: { risqueId: risque.id },
            created_by: profile.id,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (notifError) {
        // Non bloquant : le risque est déjà créé, une notification manquée
        // ne doit pas faire échouer l'opération principale.
        console.error('[risques-create] notification RISQUE_CRITIQUE', notifError);
      }
    }

    return json({ data: risque }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[risques-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
