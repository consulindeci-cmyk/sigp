import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateBudgetVersionBody {
  projectId: string;
  version: number;
  nom: string;
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

    const body: CreateBudgetVersionBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.version) return json({ error: 'version est obligatoire' }, 400);
    if (!body.nom?.trim()) return json({ error: 'nom est obligatoire' }, 400);

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

    const { data: version, error: insertError } = await admin
      .from('budget_versions')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        version: body.version,
        nom: body.nom.trim(),
        statut: body.statut ?? 'BROUILLON',
        montant_total: body.montantTotal ?? 0,
        approuve_par: body.approuvePar ?? null,
        approuve_le: body.approuveLe ?? null,
        notes: body.notes ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Une version avec ce numéro existe déjà pour ce projet' }, 409);
      }
      throw insertError;
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'budget_versions',
      enregistrement_id: version.id,
      apres: version,
      });
    } catch (historiqueError) {
      console.error('[budget-versions-create] historique', historiqueError);
    }

    return json({ data: version }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-versions-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
