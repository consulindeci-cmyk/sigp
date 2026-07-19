import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface DeletePtbaActiviteBody {
  id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['ADMIN', 'SUPER_ADMIN']);

    const body: DeletePtbaActiviteBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('ptba_activites')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Activité PTBA introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette activité n'appartient pas à votre organisation" }, 403);
      }
    }

    // Garde-fou : ptba_activite_marches a une vraie FK ON DELETE CASCADE vers
    // ptba_activites, mais cette suppression est un soft-delete (UPDATE
    // deleted_at) — la CASCADE ne se déclenche jamais. Sans ce contrôle, les
    // lignes de jonction resteraient vivantes en pointant vers une activité
    // désormais invisible (même classe de bug que sur logframe-objectives-delete).
    const { data: linkedMarches, error: marchesCheckError } = await admin
      .from('ptba_activite_marches')
      .select('id, marche:ppm_marches(id, code, intitule)')
      .eq('activite_id', body.id);
    if (marchesCheckError) throw marchesCheckError;

    if ((linkedMarches?.length ?? 0) > 0) {
      const marches = (linkedMarches ?? []).map((m: { id: string; marche: { id: string; code: string; intitule: string } | { id: string; code: string; intitule: string }[] | null }) => {
        const marche = Array.isArray(m.marche) ? m.marche[0] : m.marche;
        return { junctionId: m.id, marcheId: marche?.id ?? null, code: marche?.code ?? null, intitule: marche?.intitule ?? null };
      });
      return json({
        error: `Suppression impossible : cette activité est encore rattachée à ${marches.length} marché(s) PPM (${marches.map(m => m.code).filter(Boolean).join(', ')}). Détachez d'abord ces liaisons.`,
        dependencies: { marches },
      }, 409);
    }

    const { error: deleteError } = await admin
      .from('ptba_activites')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id);
    if (deleteError) throw deleteError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'DELETE',
      table_cible: 'ptba_activites',
      enregistrement_id: body.id,
      avant: existing,
    });

    return json({ message: 'Activité PTBA supprimée' });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ptba-delete]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
