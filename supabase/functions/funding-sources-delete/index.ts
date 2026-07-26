import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteFundingSourceBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteFundingSourceBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('funding_sources')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Source de financement introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette source de financement n'appartient pas à votre organisation" }, 403);
      }
    }

    // Garde-fou : disbursements.funding_source_id est un lien applicatif sans
    // FK — sans ce contrôle, la suppression laissait des décaissements actifs
    // pointer silencieusement vers une source "supprimée" (cf. audit Sources
    // de Financement, même patron que wbs-delete/ptba_activites).
    const { data: linkedDisbursements, error: disbursementsCheckError } = await admin
      .from('disbursements')
      .select('id, reference, montant')
      .eq('funding_source_id', body.id)
      .is('deleted_at', null);
    if (disbursementsCheckError) throw disbursementsCheckError;

    if ((linkedDisbursements?.length ?? 0) > 0) {
      const disbursements = linkedDisbursements ?? [];
      return json({
        error: `Suppression impossible : cette source de financement est encore référencée par ${disbursements.length} décaissement(s) (${disbursements.map(d => d.reference || d.id).join(', ')}). Détachez ou supprimez d'abord ces décaissements.`,
        dependencies: { disbursements },
      }, 409);
    }

    const { error: deleteError } = await admin
      .from('funding_sources')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'funding_sources',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[funding-sources-delete] historique', historiqueError);
    }

    return json({ message: 'Source de financement supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[funding-sources-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
