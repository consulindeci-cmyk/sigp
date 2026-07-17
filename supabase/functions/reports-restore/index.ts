import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface RestoreReportBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    // Même rôle que reports-delete (ADMIN seul).
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: RestoreReportBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('rapports_projet')
      .select('*')
      .eq('id', body.id)
      .not('deleted_at', 'is', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Rapport introuvable dans la corbeille' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce rapport n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: restored, error: restoreError } = await admin
      .from('rapports_projet')
      .update({ deleted_at: null, updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select('*')
      .single();
    if (restoreError) throw restoreError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'RESTORE',
      table_cible: 'rapports_projet',
      enregistrement_id: body.id,
      avant: existing,
      apres: restored,
    });

    return json({ data: restored });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[reports-restore]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
