import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateProjectBody {
  code: string;
  nom: string;
  description?: string;
  statut?: string;
  managerId?: string;
  programmeId: string;
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
    // La création de projet reste une responsabilité org_admin — un
    // SUPER_ADMIN n'en crée pas lui-même (page Projets en lecture seule
    // côté supervision plateforme).
    requireRole(profile, ['COORDINATEUR', 'ADMIN']);

    const body: CreateProjectBody = await req.json();

    if (!body.code?.trim() || !body.nom?.trim()) {
      return json({ error: 'code et nom sont obligatoires' }, 400);
    }
    // Corrige le trou identifié lors de l'audit Phase 18.2 (Critique #3) :
    // le programme est désormais un champ obligatoire explicite, plus de
    // "premier programme trouvé" arbitraire côté frontend.
    if (!body.programmeId) {
      return json({ error: 'programmeId est obligatoire' }, 400);
    }

    const { data: programme, error: programmeError } = await admin
      .from('programmes')
      .select('id')
      .eq('id', body.programmeId)
      .maybeSingle();
    if (programmeError) throw programmeError;
    if (!programme) return json({ error: 'Programme introuvable' }, 404);

    const { data: programmeOrgId, error: orgError } = await admin.rpc('programme_organisation_id', {
      p_programme_id: body.programmeId,
    });
    if (orgError) throw orgError;
    if (!programmeOrgId || programmeOrgId !== profile.organisation_id) {
      return json({ error: "Ce programme n'appartient pas à votre organisation" }, 403);
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

    const { data: project, error: insertError } = await admin
      .from('projects')
      .insert({
        // id/updated_at n'ont ni défaut ni trigger côté Postgres (gérés
        // uniquement par Prisma côté client auparavant) — obligatoires ici.
        id: crypto.randomUUID(),
        code: body.code.trim().toUpperCase(),
        nom: body.nom.trim(),
        description: body.description?.trim() ?? null,
        statut: body.statut ?? 'EN_PREPARATION',
        manager_id: body.managerId ?? null,
        programme_id: body.programmeId,
        date_debut: body.dateDebut ?? null,
        date_fin_prevue: body.dateFinPrevue ?? null,
        date_fin_effective: body.dateFinEffective ?? null,
        date_cloture_effective: body.dateClotureEffective ?? null,
        budget_total: body.budgetTotal ?? null,
        devise: body.devise ?? 'XOF',
        pays: body.pays ?? null,
        secteur: body.secteur ?? null,
        bailleur_principal: body.bailleurPrincipal ?? null,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Ce code projet est déjà utilisé' }, 409);
      }
      throw insertError;
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: project.id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'projects',
      enregistrement_id: project.id,
      apres: project,
      });
    } catch (historiqueError) {
      console.error('[projects-create] historique', historiqueError);
    }

    return json({ data: project }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[projects-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
