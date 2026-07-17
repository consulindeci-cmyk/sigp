import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateReportBody {
  id: string;
  codeRapport?: string;
  titre?: string;
  description?: string;
  type?: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL' | 'FINANCIER' | 'EVM' | 'RISQUES' | 'PTBA' | 'BAILLEUR';
  format?: 'PDF' | 'EXCEL' | 'WORD';
  statut?: 'GENERE' | 'EN_ATTENTE' | 'VALIDE' | 'ARCHIVE';
  periode?: string;
  dateGeneration?: string;
  dateTelechargement?: string;
  version?: string;
  auteur?: string;
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

    const body: UpdateReportBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('rapports_projet')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Rapport introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce rapport n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.codeRapport !== undefined) updatePayload.code_rapport = body.codeRapport.trim();
    if (body.titre !== undefined) updatePayload.titre = body.titre.trim();
    if (body.description !== undefined) updatePayload.description = body.description?.trim() ?? null;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.format !== undefined) updatePayload.format = body.format;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.periode !== undefined) updatePayload.periode = body.periode.trim();
    if (body.dateGeneration !== undefined) updatePayload.date_generation = body.dateGeneration;
    if (body.dateTelechargement !== undefined) updatePayload.date_telechargement = body.dateTelechargement;
    if (body.version !== undefined) updatePayload.version = body.version.trim();
    if (body.auteur !== undefined) updatePayload.auteur = body.auteur.trim();
    if (body.tailleKo !== undefined) updatePayload.taille_ko = body.tailleKo;
    if (body.nbTelechargements !== undefined) updatePayload.nb_telechargements = body.nbTelechargements;
    if (body.commentaires !== undefined) updatePayload.commentaires = body.commentaires?.trim() ?? null;

    const { data: updated, error: updateError } = await admin
      .from('rapports_projet')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();
    if (updateError) throw updateError;

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'rapports_projet',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[reports-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
