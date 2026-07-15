import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateContractBody {
  id: string;
  marcheId?: string;
  numero?: string;
  intitule?: string;
  type?: 'MARCHE' | 'CONVENTION' | 'PROTOCOLE' | 'LETTRE_ACCORD';
  statut?: 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE';
  titulaire?: string;
  montant?: number;
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
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN']);

    const body: UpdateContractBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('contracts')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Contrat introuvable' }, 404);

    if (profile.role !== 'ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: existing.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce contrat n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.marcheId !== undefined) updatePayload.marche_id = body.marcheId;
    if (body.numero !== undefined) updatePayload.numero = body.numero.trim();
    if (body.intitule !== undefined) updatePayload.intitule = body.intitule.trim();
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.titulaire !== undefined) updatePayload.titulaire = body.titulaire.trim();
    if (body.montant !== undefined) updatePayload.montant = body.montant;
    if (body.devise !== undefined) updatePayload.devise = body.devise;
    if (body.dateSignature !== undefined) updatePayload.date_signature = body.dateSignature;
    if (body.dateDebut !== undefined) updatePayload.date_debut = body.dateDebut;
    if (body.dateFin !== undefined) updatePayload.date_fin = body.dateFin;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('contracts')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Conflit de données sur le contrat' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: existing.project_id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'contracts',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[contracts-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
