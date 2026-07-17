import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateContractBody {
  projectId: string;
  marcheId?: string;
  numero: string;
  intitule: string;
  type?: 'MARCHE' | 'CONVENTION' | 'PROTOCOLE' | 'LETTRE_ACCORD';
  statut?: 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE';
  titulaire: string;
  montant: number;
  devise?: string;
  dateSignature?: string;
  dateDebut?: string;
  dateFin?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateContractBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.numero?.trim()) return json({ error: 'numero est obligatoire' }, 400);
    if (!body.intitule?.trim()) return json({ error: 'intitule est obligatoire' }, 400);
    if (!body.titulaire?.trim()) return json({ error: 'titulaire est obligatoire' }, 400);
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

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    const { data: contract, error: insertError } = await admin
      .from('contracts')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        marche_id: body.marcheId ?? null,
        numero: body.numero.trim(),
        intitule: body.intitule.trim(),
        type: body.type ?? 'MARCHE',
        statut: body.statut ?? 'ACTIF',
        titulaire: body.titulaire.trim(),
        montant: body.montant,
        devise: body.devise ?? 'XOF',
        date_signature: body.dateSignature ?? null,
        date_debut: body.dateDebut ?? null,
        date_fin: body.dateFin ?? null,
        notes: body.notes ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit de données sur le contrat' }, 409);
      }
      throw insertError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'contracts',
      enregistrement_id: contract.id,
      apres: contract,
    });

    return json({ data: contract }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[contracts-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
