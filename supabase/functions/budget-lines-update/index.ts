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
  // Valorisation WBS (cf. audit Budget) — null pour effacer.
  wbsId?: string | null;
  unite?: string | null;
  quantite?: number | null;
  coutUnitaire?: number | null;
  fundingSourceId?: string | null;
  // Montant réellement financé par ce bailleur sur cette ligne — null pour
  // effacer (cf. correction Matrice Budget, colonne "Financement Bailleur").
  montantBailleur?: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateBudgetLineBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);
    if (body.montantBailleur != null && body.montantBailleur < 0) {
      return json({ error: 'montantBailleur doit être supérieur ou égal à 0' }, 400);
    }

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

    if (profile.role !== 'SUPER_ADMIN') {
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

    if (body.wbsId) {
      const { data: wbs, error: wbsError } = await admin
        .from('wbs_nodes')
        .select('id, project_id')
        .eq('id', body.wbsId)
        .is('deleted_at', null)
        .maybeSingle();
      if (wbsError) throw wbsError;
      if (!wbs) return json({ error: 'Nœud WBS introuvable' }, 404);
      if (wbs.project_id !== version?.project_id) {
        return json({ error: 'Le nœud WBS appartient à un autre projet' }, 409);
      }
    }

    if (body.fundingSourceId) {
      const { data: fs, error: fsError } = await admin
        .from('funding_sources')
        .select('id, project_id')
        .eq('id', body.fundingSourceId)
        .is('deleted_at', null)
        .maybeSingle();
      if (fsError) throw fsError;
      if (!fs) return json({ error: 'Source de financement introuvable' }, 404);
      if (fs.project_id !== version?.project_id) {
        return json({ error: 'La source de financement appartient à un autre projet' }, 409);
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
    if (body.wbsId !== undefined) updatePayload.wbs_id = body.wbsId;
    if (body.unite !== undefined) updatePayload.unite = body.unite?.trim() || null;
    if (body.quantite !== undefined) updatePayload.quantite = body.quantite;
    if (body.coutUnitaire !== undefined) updatePayload.cout_unitaire = body.coutUnitaire;
    if (body.fundingSourceId !== undefined) updatePayload.funding_source_id = body.fundingSourceId;
    if (body.montantBailleur !== undefined) updatePayload.montant_bailleur = body.montantBailleur;

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

    try {
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
    } catch (historiqueError) {
      console.error('[budget-lines-update] historique', historiqueError);
    }

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[budget-lines-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
