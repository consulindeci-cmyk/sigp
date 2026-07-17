import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreatePpmMarcheBody {
  projectId: string;
  code: string;
  intitule: string;
  type: 'FOURNITURES' | 'TRAVAUX' | 'SERVICES' | 'CONSULTANTS';
  statut?: string;
  montantEstime?: number;
  montantSigne?: number;
  dateLancementPrevu?: string;
  dateSoumissionPrevu?: string;
  dateAttribution?: string;
  dateSignature?: string;
  dateFinPrevue?: string;
  dateFinEffective?: string;
  titulaire?: string;
  notes?: string;
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

    const { data: marche, error: insertError } = await admin
      .from('ppm_marches')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        code: body.code.trim(),
        intitule: body.intitule.trim(),
        type: body.type,
        statut: body.statut ?? 'EN_PREPARATION',
        montant_estime: body.montantEstime ?? null,
        montant_signe: body.montantSigne ?? null,
        date_lancement_prevu: body.dateLancementPrevu ?? null,
        date_soumission_prevu: body.dateSoumissionPrevu ?? null,
        date_attribution: body.dateAttribution ?? null,
        date_signature: body.dateSignature ?? null,
        date_fin_prevue: body.dateFinPrevue ?? null,
        date_fin_effective: body.dateFinEffective ?? null,
        titulaire: body.titulaire ?? null,
        notes: body.notes ?? null,
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

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'ppm_marches',
      enregistrement_id: marche.id,
      apres: marche,
    });

    return json({ data: marche }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
