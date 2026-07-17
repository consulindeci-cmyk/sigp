import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdateProjectBody {
  id: string;
  nom?: string;
  description?: string;
  statut?: string;
  managerId?: string;
  programmeId?: string;
  dateDebut?: string;
  dateFinPrevue?: string;
  dateFinEffective?: string;
  dateClotureEffective?: string;
  budgetTotal?: number;
  devise?: string;
  pays?: string;
  secteur?: string;
  bailleurPrincipal?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'ADMIN', 'SUPER_ADMIN']);

    const body: UpdateProjectBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    const { data: existing, error: findError } = await admin
      .from('projects')
      .select('*')
      .eq('id', body.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Projet introuvable' }, 404);

    // Cloisonnement : un non-ADMIN ne peut modifier qu'un projet de sa propre organisation
    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    if (body.programmeId && body.programmeId !== existing.programme_id) {
      const { data: programme, error: programmeError } = await admin
        .from('programmes')
        .select('id')
        .eq('id', body.programmeId)
        .maybeSingle();
      if (programmeError) throw programmeError;
      if (!programme) return json({ error: 'Programme introuvable' }, 404);

      if (profile.role !== 'SUPER_ADMIN') {
        const { data: newProgrammeOrgId, error: orgError2 } = await admin.rpc('programme_organisation_id', {
          p_programme_id: body.programmeId,
        });
        if (orgError2) throw orgError2;
        if (!newProgrammeOrgId || newProgrammeOrgId !== profile.organisation_id) {
          return json({ error: "Ce programme n'appartient pas à votre organisation" }, 403);
        }
      }
    }

    if (body.managerId) {
      const { data: manager, error: managerError } = await admin
        .from('users')
        .select('id')
        .eq('id', body.managerId)
        .maybeSingle();
      if (managerError) throw managerError;
      if (!manager) return json({ error: 'Chef de projet introuvable' }, 404);
    }

    // updated_at n'a ni défaut ni trigger côté Postgres — obligatoire ici.
    const updatePayload: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (body.programmeId !== undefined) updatePayload.programme_id = body.programmeId;
    if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.statut !== undefined) updatePayload.statut = body.statut;
    if (body.managerId !== undefined) updatePayload.manager_id = body.managerId;
    if (body.dateDebut !== undefined) updatePayload.date_debut = body.dateDebut;
    if (body.dateFinPrevue !== undefined) updatePayload.date_fin_prevue = body.dateFinPrevue;
    if (body.dateFinEffective !== undefined) updatePayload.date_fin_effective = body.dateFinEffective;
    if (body.dateClotureEffective !== undefined) updatePayload.date_cloture_effective = body.dateClotureEffective;
    if (body.budgetTotal !== undefined) updatePayload.budget_total = body.budgetTotal;
    if (body.devise !== undefined) updatePayload.devise = body.devise;
    if (body.pays !== undefined) updatePayload.pays = body.pays;
    if (body.secteur !== undefined) updatePayload.secteur = body.secteur;
    if (body.bailleurPrincipal !== undefined) updatePayload.bailleur_principal = body.bailleurPrincipal;

    const { data: updated, error: updateError } = await admin
      .from('projects')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: 'Ce code projet est déjà utilisé' }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.id,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'projects',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[projects-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
