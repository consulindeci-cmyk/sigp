import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateLivrableBody {
  id: string;
  wbsId?: string;
  code?: string;
  nom?: string;
  description?: string;
  statut?: 'NON_COMMENCE' | 'EN_COURS' | 'SOUMIS' | 'EN_REVISION' | 'VALIDE' | 'REJETE' | 'EN_RETARD';
  datePrevue?: string;
  dateSoumission?: string;
  dateValidation?: string;
  responsableId?: string;
  validateurId?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateLivrableBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('livrables')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Livrable introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce livrable n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.wbsId !== undefined) updatePayload.wbs_id = body.wbsId;
    if (body.code !== undefined) updatePayload.code = body.code;
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.datePrevue !== undefined) updatePayload.date_prevue = body.datePrevue;
    if (body.dateSoumission !== undefined) updatePayload.date_soumission = body.dateSoumission;
    if (body.dateValidation !== undefined) updatePayload.date_validation = body.dateValidation;
    if (body.responsableId !== undefined) updatePayload.responsable_id = body.responsableId;
    if (body.validateurId !== undefined) updatePayload.validateur_id = body.validateurId;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('livrables')
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
      table_cible: 'livrables',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[livrables-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
