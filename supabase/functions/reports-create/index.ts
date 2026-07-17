import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateReportBody {
  projectId: string;
  codeRapport: string;
  titre: string;
  description?: string;
  type: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL' | 'FINANCIER' | 'EVM' | 'RISQUES' | 'PTBA' | 'BAILLEUR';
  format: 'PDF' | 'EXCEL' | 'WORD';
  statut?: 'GENERE' | 'EN_ATTENTE' | 'VALIDE' | 'ARCHIVE';
  periode: string;
  dateGeneration: string;
  dateTelechargement?: string;
  version: string;
  auteur: string;
  tailleKo?: number;
  nbTelechargements?: number;
  commentaires?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateReportBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.codeRapport?.trim()) return json({ error: 'codeRapport est obligatoire' }, 400);
    if (!body.titre?.trim()) return json({ error: 'titre est obligatoire' }, 400);
    if (!body.type) return json({ error: 'type est obligatoire' }, 400);
    if (!body.format) return json({ error: 'format est obligatoire' }, 400);
    if (!body.periode?.trim()) return json({ error: 'periode est obligatoire' }, 400);
    if (!body.dateGeneration) return json({ error: 'dateGeneration est obligatoire' }, 400);
    if (!body.version?.trim()) return json({ error: 'version est obligatoire' }, 400);
    if (!body.auteur?.trim()) return json({ error: 'auteur est obligatoire' }, 400);

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

    const { data: report, error: insertError } = await admin
      .from('rapports_projet')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        code_rapport: body.codeRapport.trim(),
        titre: body.titre.trim(),
        description: body.description?.trim() ?? null,
        type: body.type,
        format: body.format,
        statut: body.statut ?? 'GENERE',
        periode: body.periode.trim(),
        date_generation: body.dateGeneration,
        date_telechargement: body.dateTelechargement ?? null,
        version: body.version.trim(),
        auteur: body.auteur.trim(),
        taille_ko: body.tailleKo ?? 0,
        nb_telechargements: body.nbTelechargements ?? 0,
        commentaires: body.commentaires?.trim() ?? null,
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
      table_cible: 'rapports_projet',
      enregistrement_id: report.id,
      apres: report,
    });

    return json({ data: report }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[reports-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
