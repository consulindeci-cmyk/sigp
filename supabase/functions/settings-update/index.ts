import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateSettingBody {
  id: string;
  nom?: string;
  description?: string;
  valeur?: string;
  valeurDefaut?: string;
  typeValeur?: string;
  requis?: boolean;
  modifiable?: boolean;
  statut?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateSettingBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('project_settings')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Paramètre introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce paramètre n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      modifie_par: profile.id,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.valeur !== undefined) updatePayload.valeur = body.valeur;
    if (body.valeurDefaut !== undefined) updatePayload.valeur_defaut = body.valeurDefaut;
    if (body.typeValeur !== undefined) updatePayload.type_valeur = body.typeValeur;
    if (body.requis !== undefined) updatePayload.requis = body.requis;
    if (body.modifiable !== undefined) updatePayload.modifiable = body.modifiable;
    if (body.statut !== undefined) updatePayload.statut = body.statut;

    const { data: updated, error: updateError } = await admin
      .from('project_settings')
      .update(updatePayload)
      .eq('id', body.id)
      .select('*, modificateur:users!modifie_par(nom, prenom)')
      .single();
    if (updateError) throw updateError;

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'project_settings',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
      });
    } catch (historiqueError) {
      console.error('[settings-update] historique', historiqueError);
    }

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[settings-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
