import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateLogframeIndicatorBody {
  id: string;
  libelle?: string;
  type?: 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS';
  unite?: string;
  valeurBaseline?: number;
  valeurCible?: number;
  valeurActuelle?: number;
  sourceVerification?: string;
  periodicite?: string;
  actif?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateLogframeIndicatorBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('logframe_indicators')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Indicateur introuvable' }, 404);

    const { data: objective, error: objError } = await admin
      .from('logframe_objectives')
      .select('project_id')
      .eq('id', existing.objective_id)
      .maybeSingle();
    if (objError) throw objError;

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('logframe_objective_organisation_id', {
        p_objective_id: existing.objective_id,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cet indicateur n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.unite !== undefined) updatePayload.unite = body.unite?.trim() ?? null;
    if (body.valeurBaseline !== undefined) updatePayload.valeur_baseline = body.valeurBaseline;
    if (body.valeurCible !== undefined) updatePayload.valeur_cible = body.valeurCible;
    if (body.valeurActuelle !== undefined) updatePayload.valeur_actuelle = body.valeurActuelle;
    if (body.sourceVerification !== undefined) {
      updatePayload.source_verification = body.sourceVerification?.trim() ?? null;
    }
    if (body.periodicite !== undefined) updatePayload.periodicite = body.periodicite?.trim() ?? null;
    if (body.actif !== undefined) updatePayload.actif = body.actif;

    const { data: updated, error: updateError } = await admin
      .from('logframe_indicators')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur l’indicateur' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: objective?.project_id ?? null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'logframe_indicators',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-indicators-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
