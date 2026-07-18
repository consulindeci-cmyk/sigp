import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface SetPpmActivitesBody {
  marcheId: string;
  activiteIds: string[];
}

// Remplace intégralement l'ensemble des activités PTBA liées à un marché —
// plus simple côté UI (un multi-select "voici exactement les activités
// couvertes") qu'un attach/detach incrémental.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: SetPpmActivitesBody = await req.json();
    if (!body.marcheId) return json({ error: 'marcheId est obligatoire' }, 400);
    if (!Array.isArray(body.activiteIds)) return json({ error: 'activiteIds doit être un tableau' }, 400);

    const { data: marche, error: marcheError } = await admin
      .from('ppm_marches')
      .select('id, project_id')
      .eq('id', body.marcheId)
      .is('deleted_at', null)
      .maybeSingle();
    if (marcheError) throw marcheError;
    if (!marche) return json({ error: 'Marché introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: marche.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce marché n'appartient pas à votre organisation" }, 403);
      }
    }

    // Cohérence de projet : chaque activité doit appartenir au même projet
    // que le marché (logique métier inter-tables, vérifiée ici comme pour
    // wbs_id/logframe_ref_id sur ptba_activites — pas en RLS).
    const uniqueIds = [...new Set(body.activiteIds)];
    if (uniqueIds.length > 0) {
      const { data: activites, error: activitesError } = await admin
        .from('ptba_activites')
        .select('id, project_id')
        .in('id', uniqueIds)
        .is('deleted_at', null);
      if (activitesError) throw activitesError;
      if (!activites || activites.length !== uniqueIds.length) {
        return json({ error: 'Une ou plusieurs activités sont introuvables' }, 404);
      }
      const foreign = activites.find(a => a.project_id !== marche.project_id);
      if (foreign) {
        return json({ error: "Une activité n'appartient pas au même projet que le marché" }, 409);
      }
    }

    const { error: deleteError } = await admin
      .from('ptba_activite_marches')
      .delete()
      .eq('marche_id', body.marcheId);
    if (deleteError) throw deleteError;

    if (uniqueIds.length > 0) {
      const { error: insertError } = await admin
        .from('ptba_activite_marches')
        .insert(uniqueIds.map(activiteId => ({
          id: crypto.randomUUID(),
          marche_id: body.marcheId,
          activite_id: activiteId,
          created_by: profile.id,
        })));
      if (insertError) throw insertError;
    }

    return json({ data: { marcheId: body.marcheId, activiteIds: uniqueIds } });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-activites-set]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
