import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdatePpmMarcheBody {
  id: string;
  code?: string;
  intitule?: string;
  type?: 'FOURNITURES' | 'TRAVAUX' | 'SERVICES' | 'CONSULTANTS';
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
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN']);

    const body: UpdatePpmMarcheBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('ppm_marches')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Marché PPM introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce marché n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.code !== undefined) updatePayload.code = body.code.trim();
    if (body.intitule !== undefined) updatePayload.intitule = body.intitule.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.montantEstime !== undefined) updatePayload.montant_estime = body.montantEstime;
    if (body.montantSigne !== undefined) updatePayload.montant_signe = body.montantSigne;
    if (body.dateLancementPrevu !== undefined) updatePayload.date_lancement_prevu = body.dateLancementPrevu;
    if (body.dateSoumissionPrevu !== undefined) updatePayload.date_soumission_prevu = body.dateSoumissionPrevu;
    if (body.dateAttribution !== undefined) updatePayload.date_attribution = body.dateAttribution;
    if (body.dateSignature !== undefined) updatePayload.date_signature = body.dateSignature;
    if (body.dateFinPrevue !== undefined) updatePayload.date_fin_prevue = body.dateFinPrevue;
    if (body.dateFinEffective !== undefined) updatePayload.date_fin_effective = body.dateFinEffective;
    if (body.titulaire !== undefined) updatePayload.titulaire = body.titulaire;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('ppm_marches')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Ce code marché existe déjà dans ce projet' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'ppm_marches',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
