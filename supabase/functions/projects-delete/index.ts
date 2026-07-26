import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeleteProjectBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // SUPER_ADMIN rétabli en fallback d'urgence (cf. audit Rôles) : la
    // suppression reste une responsabilité org_admin au quotidien, mais le
    // SUPER_ADMIN plateforme doit pouvoir agir en cas d'incident — c'était
    // le seul Edge Function de toute l'app à l'exclure d'une opération
    // d'écriture, une incohérence par rapport à tous les autres -delete.
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeleteProjectBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('projects')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    // Soft delete — jamais de suppression physique (cohérent avec le
    // comportement NestJS : deleted_at horodaté, ligne conservée).
    const { error: deleteError } = await admin
      .from('projects')
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
      project_id: body.id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'projects',
      enregistrement_id: body.id,
      avant: existing,
      });
    } catch (historiqueError) {
      console.error('[projects-delete] historique', historiqueError);
    }

    return json({ message: 'Projet supprimé' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[projects-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
