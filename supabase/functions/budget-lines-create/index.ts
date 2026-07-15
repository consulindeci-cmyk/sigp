import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateBudgetLineBody {
  versionId: string;
  parentId?: string;
  codeLigne: string;
  libelle: string;
  categorie?: string;
  montantPrevu?: number;
  montantEngage?: number;
  montantPaye?: number;
  ordre?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN']);

    const body: CreateBudgetLineBody = await req.json();
    if (!body.versionId) return json({ error: 'versionId est obligatoire' }, 400);
    if (!body.codeLigne?.trim()) return json({ error: 'codeLigne est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);

    const { data: version, error: versionError } = await admin
      .from('budget_versions')
      .select('id, project_id')
      .eq('id', body.versionId)
      .is('deleted_at', null)
      .maybeSingle();
    if (versionError) throw versionError;
    if (!version) return json({ error: 'Version budgétaire introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: version.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Cette version n'appartient pas à votre organisation" }, 403);
      }
    }

    // Réplique BudgetLineService.validateParent : le parent doit exister et
    // appartenir à la même version budgétaire (protège contre les hiérarchies
    // incohérentes inter-versions).
    if (body.parentId) {
      const { data: parent, error: parentError } = await admin
        .from('budget_lignes')
        .select('id, version_id')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'La ligne parente est introuvable' }, 404);
      if (parent.version_id !== body.versionId) {
        return json({ error: 'La ligne parente appartient à une autre version budgétaire' }, 409);
      }
    }

    const { data: ligne, error: insertError } = await admin
      .from('budget_lignes')
      .insert({
        id: crypto.randomUUID(),
        version_id: body.versionId,
        parent_id: body.parentId ?? null,
        code_ligne: body.codeLigne.trim(),
        libelle: body.libelle.trim(),
        categorie: body.categorie ?? null,
        montant_prevu: body.montantPrevu ?? 0,
        montant_engage: body.montantEngage ?? 0,
        montant_paye: body.montantPaye ?? 0,
        ordre: body.ordre ?? 0,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Une ligne avec ce code existe déjà dans cette version' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: version.project_id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'budget_lignes',
      enregistrement_id: ligne.id,
      apres: ligne,
    });

    return json({ data: ligne }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-lines-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
