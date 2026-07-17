import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateLivrableBody {
  projectId: string;
  wbsId?: string;
  code?: string;
  nom: string;
  description?: string;
  statut?: 'NON_COMMENCE' | 'EN_COURS' | 'SOUMIS' | 'EN_REVISION' | 'VALIDE' | 'REJETE' | 'EN_RETARD';
  datePrevue?: string;
  dateSoumission?: string;
  dateValidation?: string;
  responsableId?: string;
  validateurId?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateLivrableBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.nom?.trim()) return json({ error: 'nom est obligatoire' }, 400);

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: livrable, error: insertError } = await admin
      .from('livrables')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        wbs_id: body.wbsId ?? null,
        code: body.code ?? null,
        nom: body.nom.trim(),
        description: body.description ?? null,
        statut: body.statut ?? 'NON_COMMENCE',
        date_prevue: body.datePrevue ?? null,
        date_soumission: body.dateSoumission ?? null,
        date_validation: body.dateValidation ?? null,
        responsable_id: body.responsableId ?? null,
        validateur_id: body.validateurId ?? null,
        notes: body.notes ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'livrables',
      enregistrement_id: livrable.id,
      apres: livrable,
    });

    return json({ data: livrable }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[livrables-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
