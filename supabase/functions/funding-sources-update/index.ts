import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateFundingSourceBody {
  id: string;
  nom?: string;
  type?: 'BAILLEUR' | 'CONTREPARTIE_NATIONALE' | 'AUTRE';
  montant?: number;
  pourcentage?: number;
  devise?: string;
  dateAccord?: string;
  dateExpiry?: string;
  contact?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN']);

    const body: UpdateFundingSourceBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('funding_sources')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Source de financement introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette source n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.montant !== undefined) updatePayload.montant = body.montant;
    if (body.pourcentage !== undefined) updatePayload.pourcentage = body.pourcentage;
    if (body.devise !== undefined) updatePayload.devise = body.devise;
    if (body.dateAccord !== undefined) updatePayload.date_accord = body.dateAccord;
    if (body.dateExpiry !== undefined) updatePayload.date_expiry = body.dateExpiry;
    if (body.contact !== undefined) updatePayload.contact = body.contact;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('funding_sources')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur la source de financement' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'funding_sources',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[funding-sources-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
