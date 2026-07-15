import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateFundingSourceBody {
  projectId: string;
  nom: string;
  type?: 'BAILLEUR' | 'CONTREPARTIE_NATIONALE' | 'AUTRE';
  montant: number;
  pourcentage?: number;
  devise?: string;
  dateAccord?: string;
  dateExpiry?: string;
  contact?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN']);

    const body: CreateFundingSourceBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.nom?.trim()) return json({ error: 'nom est obligatoire' }, 400);
    if (body.montant === undefined || body.montant === null) {
      return json({ error: 'montant est obligatoire' }, 400);
    }

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: source, error: insertError } = await admin
      .from('funding_sources')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        nom: body.nom.trim(),
        type: body.type ?? 'BAILLEUR',
        montant: body.montant,
        pourcentage: body.pourcentage ?? null,
        devise: body.devise ?? 'XOF',
        date_accord: body.dateAccord ?? null,
        date_expiry: body.dateExpiry ?? null,
        contact: body.contact ?? null,
        notes: body.notes ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur la source de financement' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'funding_sources',
      enregistrement_id: source.id,
      apres: source,
    });

    return json({ data: source }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[funding-sources-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
