import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateLogframeIndicatorBody {
  objectiveId: string;
  code: string;
  libelle: string;
  type?: 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS';
  unite?: string;
  valeurBaseline?: number;
  valeurCible?: number;
  valeurActuelle?: number;
  sourceVerification?: string;
  periodicite?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateLogframeIndicatorBody = await req.json();
    if (!body.objectiveId) return json({ error: 'objectiveId est obligatoire' }, 400);
    if (!body.code?.trim()) return json({ error: 'code est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);

    const { data: objective, error: objError } = await admin
      .from('logframe_objectives')
      .select('id, project_id')
      .eq('id', body.objectiveId)
      .is('deleted_at', null)
      .maybeSingle();
    if (objError) throw objError;
    if (!objective) return json({ error: 'Objectif introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('logframe_objective_organisation_id', {
        p_objective_id: body.objectiveId,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Cet objectif n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: indicator, error: insertError } = await admin
      .from('logframe_indicators')
      .insert({
        id: crypto.randomUUID(),
        objective_id: body.objectiveId,
        code: body.code.trim().toUpperCase(),
        libelle: body.libelle.trim(),
        type: body.type ?? 'OUTPUT',
        unite: body.unite?.trim() ?? null,
        valeur_baseline: body.valeurBaseline ?? null,
        valeur_cible: body.valeurCible ?? null,
        valeur_actuelle: body.valeurActuelle ?? null,
        source_verification: body.sourceVerification?.trim() ?? null,
        periodicite: body.periodicite?.trim() ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur l’indicateur' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: objective.project_id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'logframe_indicators',
      enregistrement_id: indicator.id,
      apres: indicator,
    });

    return json({ data: indicator }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[logframe-indicators-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
