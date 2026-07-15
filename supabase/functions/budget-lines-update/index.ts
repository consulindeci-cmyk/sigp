import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateBudgetLineBody {
  id: string;
  parentId?: string;
  libelle?: string;
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

    const body: UpdateBudgetLineBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('budget_lignes')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Ligne budgétaire introuvable' }, 404);

    const { data: version, error: versionError } = await admin
      .from('budget_versions')
      .select('id, project_id')
      .eq('id', existing.version_id)
      .maybeSingle();
    if (versionError) throw versionError;

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: version?.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette ligne n'appartient pas à votre organisation" }, 403);
      }
    }

    if (body.parentId) {
      const { data: parent, error: parentError } = await admin
        .from('budget_lignes')
        .select('id, version_id')
        .eq('id', body.parentId)
        .is('deleted_at', null)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ error: 'La ligne parente est introuvable' }, 404);
      if (parent.version_id !== existing.version_id) {
        return json({ error: 'La ligne parente appartient à une autre version budgétaire' }, 409);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.parentId !== undefined) updatePayload.parent_id = body.parentId;
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.categorie !== undefined) updatePayload.categorie = body.categorie;
    if (body.montantPrevu !== undefined) updatePayload.montant_prevu = body.montantPrevu;
    if (body.montantEngage !== undefined) updatePayload.montant_engage = body.montantEngage;
    if (body.montantPaye !== undefined) updatePayload.montant_paye = body.montantPaye;
    if (body.ordre !== undefined) updatePayload.ordre = body.ordre;

    const { data: updated, error: updateError } = await admin
      .from('budget_lignes')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Une ligne avec ce code existe déjà dans cette version' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: version?.project_id ?? null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'budget_lignes',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-lines-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
