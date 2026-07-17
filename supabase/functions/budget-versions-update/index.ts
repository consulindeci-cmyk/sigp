import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateBudgetVersionBody {
  id: string;
  nom?: string;
  statut?: 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REVISE' | 'CLOTURE';
  montantTotal?: number;
  approuvePar?: string;
  approuveLe?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateBudgetVersionBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('budget_versions')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Version budgétaire introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette version n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.montantTotal !== undefined) updatePayload.montant_total = body.montantTotal;
    if (body.approuvePar !== undefined) updatePayload.approuve_par = body.approuvePar;
    if (body.approuveLe !== undefined) updatePayload.approuve_le = body.approuveLe;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('budget_versions')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Une version avec ce numéro existe déjà pour ce projet' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'budget_versions',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-versions-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
