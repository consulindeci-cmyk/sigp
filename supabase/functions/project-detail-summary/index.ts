import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';
import { buildUserScopedClient } from '../_shared/user-scoped-client.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Lecture seule, portée fidèlement depuis project.service.ts /
// project.repository.ts (getSummary, getTopRisks, getCriticalActivities,
// getDisbursementsMonthly, getBudgetDistribution, getFundingSources,
// getMilestones, + l'agrégation "ligne de liste" de getBatchAggregations
// appliquée à un seul projet, pour usage par useProject(id)).
//
// Même déviation architecturale que dashboard-summary : client scopé au JWT
// de l'appelant, pas service_role — RLS gère déjà l'org-scoping sur chaque
// table (risques/ptba_activites/livrables/contracts/disbursements/etc.).
//
// Note : contrairement à `findAll` (qui filtre par organisationId), les
// méthodes NestJS getSummary/getTopRisks/etc. ne vérifient AUCUNE cohérence
// d'organisation sur l'id de projet fourni — un utilisateur connaissant l'UUID
// d'un projet d'une autre organisation pourrait en théorie lire son détail
// côté NestJS. RLS ferme ce trou automatiquement ici (amélioration, pas une
// régression) : le SELECT sur `projects` retournera simplement aucune ligne
// si le projet n'appartient pas à l'organisation de l'appelant.
// ─────────────────────────────────────────────────────────────────────────────

interface Body {
  projectId: string;
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
function monthLabel(d: Date): string {
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
function monthSortKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    await authorize(req);
    const db = buildUserScopedClient(req);

    const body: Body = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('id, statut, nom, description, budget_total, manager_id, programme_id, secteur, pays, devise, date_debut, bailleur_principal')
      .eq('id', body.projectId)
      .is('deleted_at', null)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    const [
      budgetLignesRows,
      ptbaRows,
      livrablesRows,
      contratsRows,
      risquesRows,
      wbsRootCount,
      budgetVersionIdsRows,
      fundingSourcesRows,
      milestonesRows,
      criticalActivitiesRows,
      evmRes,
    ] = await Promise.all([
      db.from('budget_lignes').select('categorie, montant_prevu, montant_engage, montant_paye, version:budget_versions!inner(project_id)')
        .is('deleted_at', null).eq('version.project_id', body.projectId),
      db.from('ptba_activites').select('statut, taux_realisation').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('livrables').select('statut').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('contracts').select('id, statut').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('risques').select('id, description, niveau_criticite, probabilite, impact, strategie, statut')
        .is('deleted_at', null).eq('project_id', body.projectId),
      db.from('wbs_nodes').select('*', { count: 'exact', head: true }).is('deleted_at', null)
        .eq('project_id', body.projectId).is('parent_id', null),
      db.from('budget_versions').select('id').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('funding_sources').select('id, nom, montant, pourcentage').eq('project_id', body.projectId).order('montant', { ascending: false }),
      db.from('livrables').select('id, nom, date_prevue, statut').eq('project_id', body.projectId).order('date_prevue', { ascending: true }),
      db.from('ptba_activites').select('id, code, libelle, responsable_id, statut, taux_realisation, date_fin_prevue')
        .eq('project_id', body.projectId)
        .or(`statut.eq.EN_RETARD,and(statut.not.in.(TERMINE,ANNULE),date_fin_prevue.lt.${new Date().toISOString()})`),
      // Même fonction unifiée que l'onglet EVM (calculate_project_evm) — évite
      // que "Physique" affiche ici une moyenne non pondérée différente du
      // vrai EV/BAC montré une fois sur l'onglet EVM (cf. audit).
      db.rpc('calculate_project_evm', { p_project_id: body.projectId }).single(),
    ]);

    for (const [name, res] of Object.entries({
      budgetLignesRows, ptbaRows, livrablesRows, contratsRows, risquesRows, wbsRootCount,
      budgetVersionIdsRows, fundingSourcesRows, milestonesRows, criticalActivitiesRows, evmRes,
    })) {
      if (res.error) throw new Error(`[${name}] ${res.error.message}`);
    }

    // Décaissements liés au projet via l'un des 3 chemins indirects
    // (budget_version_id / funding_source_id / contract_id) — filtré sur les
    // colonnes scalaires directes de `disbursements`, pas sur des chemins
    // imbriqués (PostgREST ne supporte pas .or() sur des colonnes de tables
    // jointes non-!inner, ce qui provoquait une erreur 400 silencieuse ici).
    const versionIds = (budgetVersionIdsRows.data ?? []).map((v) => v.id);
    const fundingSourceIds = (fundingSourcesRows.data ?? []).map((f) => f.id);
    const contractIds = (contratsRows.data ?? []).map((c) => c.id);
    const disbOrClauses = [
      versionIds.length ? `budget_version_id.in.(${versionIds.join(',')})` : null,
      fundingSourceIds.length ? `funding_source_id.in.(${fundingSourceIds.join(',')})` : null,
      contractIds.length ? `contract_id.in.(${contractIds.join(',')})` : null,
    ].filter((c): c is string => c !== null);

    const disbursementsRows = disbOrClauses.length
      ? await db.from('disbursements').select('montant, statut, date_prevue, date_reelle').or(disbOrClauses.join(','))
      : { data: [] as { montant: number; statut: string; date_prevue: string | null; date_reelle: string | null }[], error: null };
    if (disbursementsRows.error) throw disbursementsRows.error;

    // ── getSummary ──────────────────────────────────────────────────────────
    const budgetTotal = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_prevu ?? 0), 0);
    const montantEngage = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_engage ?? 0), 0);
    const montantPaye = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_paye ?? 0), 0);
    const soldeDisponible = budgetTotal - montantPaye;
    const tauxDecaissement = budgetTotal > 0 ? Math.round((montantPaye / budgetTotal) * 10000) / 100 : 0;

    const ptbaList = ptbaRows.data ?? [];
    const nombreActivites = ptbaList.length;
    const activitesTerminees = ptbaList.filter((a) => a.statut === 'TERMINE').length;
    const activitesEnCours = ptbaList.filter((a) => a.statut === 'EN_COURS').length;
    const activitesEnRetard = ptbaList.filter((a) => a.statut === 'EN_RETARD').length;
    // Progrès physique pondéré par le budget (EV / BAC), pas une moyenne brute
    // des % d'avancement — même méthode que calculate_project_evm() (onglet
    // EVM), pour ne plus jamais afficher deux "Physique" différents.
    const evm = evmRes.data as { pv: number; ev: number; ac: number; bac: number } | null;
    const tauxAvancementGlobal = evm && Number(evm.bac) > 0
      ? Math.round((Number(evm.ev) / Number(evm.bac)) * 100)
      : 0;

    const livrablesList = livrablesRows.data ?? [];
    const nombreLivrables = livrablesList.length;
    const livrablesTermines = livrablesList.filter((l) => l.statut === 'VALIDE').length;
    const livrablesEnCours = livrablesList.filter((l) => l.statut === 'EN_COURS').length;

    const contratsList = contratsRows.data ?? [];
    const nombreContrats = contratsList.length;
    const contratsActifs = contratsList.filter((c) => c.statut === 'ACTIF').length;

    const risquesList = risquesRows.data ?? [];
    const nombreRisques = risquesList.length;
    const risquesCritiques = risquesList.filter((r) => r.niveau_criticite === 'CRITIQUE').length;

    let displayStatus = 'En préparation';
    if (project.statut === 'EN_COURS') {
      displayStatus = risquesCritiques > 0 ? 'En difficulté' : activitesEnRetard > 0 ? 'En retard' : 'En bonne voie';
    } else if (project.statut === 'CLOTURE') displayStatus = 'Clôturé';
    else if (project.statut === 'SUSPENDU') displayStatus = 'Suspendu';
    else if (project.statut === 'ANNULE') displayStatus = 'Annulé';

    // Réplique le calcul de ProjectService.getSummary : % de champs "profil" renseignés.
    const profileFields = [
      project.nom, project.description, project.budget_total, project.manager_id,
      project.programme_id, project.secteur, project.pays, project.devise,
      project.date_debut, project.bailleur_principal,
    ];
    const filledFields = profileFields.filter((f) => f !== null && f !== undefined && f !== '');
    const profileScore = Math.round((filledFields.length / profileFields.length) * 100);

    const summary = {
      budgetTotal, montantEngage, montantPaye, soldeDisponible, tauxDecaissement,
      nombreActivites, activitesTerminees, activitesEnCours, activitesEnRetard,
      nombreLivrables, livrablesTermines, livrablesEnCours,
      nombreContrats, contratsActifs, nombreRisques, risquesCritiques,
      tauxAvancementGlobal, progressScore: tauxAvancementGlobal,
      profileScore,
      displayStatus,
    };

    // ── rowAggregation (pour useProject(id), même formule que getBatchAggregations) ──
    const rowAggregation = {
      progressScore: tauxAvancementGlobal,
      tauxDecaissement,
      composantes: wbsRootCount.count ?? 0,
      activites: nombreActivites,
      livrables: nombreLivrables,
    };

    // ── getTopRisks ─────────────────────────────────────────────────────────
    const PROB_ORDER: Record<string, number> = { QUASI_CERTAIN: 3, PROBABLE: 2, POSSIBLE: 1, FAIBLE: 0 };
    const topRisks = [...risquesList]
      .sort((a, b) => {
        const aCrit = a.niveau_criticite === 'CRITIQUE' ? 1 : 0;
        const bCrit = b.niveau_criticite === 'CRITIQUE' ? 1 : 0;
        if (bCrit !== aCrit) return bCrit - aCrit;
        return (PROB_ORDER[b.probabilite] ?? 0) - (PROB_ORDER[a.probabilite] ?? 0);
      })
      .slice(0, 5)
      .map((r) => ({
        id: r.id, description: r.description, niveauCriticite: r.niveau_criticite,
        probabilite: r.probabilite, impact: r.impact, strategie: r.strategie ?? null, statut: r.statut,
      }));

    // ── getCriticalActivities ───────────────────────────────────────────────
    const now = new Date();
    const criticalActivities = (criticalActivitiesRows.data ?? []).map((a) => ({
      id: a.id, code: a.code, nom: a.libelle, responsable: a.responsable_id ?? null, statut: a.statut,
      avancement: Math.round(Number(a.taux_realisation ?? 0)),
      dateFinPrevue: a.date_fin_prevue ?? null,
      joursRetard: a.date_fin_prevue ? Math.ceil((now.getTime() - new Date(a.date_fin_prevue).getTime()) / 86400000) : 0,
    }));

    // ── getDisbursementsMonthly ─────────────────────────────────────────────
    const buckets = new Map<string, { montantPrevu: number; montantPaye: number; sortKey: string }>();
    const getOrCreate = (label: string, sortKey: string) => {
      if (!buckets.has(label)) buckets.set(label, { montantPrevu: 0, montantPaye: 0, sortKey });
      return buckets.get(label)!;
    };
    for (const d of disbursementsRows.data ?? []) {
      if (d.date_prevue) {
        const dt = new Date(d.date_prevue);
        getOrCreate(monthLabel(dt), monthSortKey(dt)).montantPrevu += Number(d.montant);
      }
      if (d.statut === 'DECAISSE' && d.date_reelle) {
        const dt = new Date(d.date_reelle);
        getOrCreate(monthLabel(dt), monthSortKey(dt)).montantPaye += Number(d.montant);
      }
    }
    const disbursementsMonthly = [...buckets.entries()]
      .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
      .map(([month, b]) => ({ month, montantPrevu: Math.round(b.montantPrevu), montantPaye: Math.round(b.montantPaye) }));

    // ── getBudgetDistribution ───────────────────────────────────────────────
    const distMap = new Map<string, number>();
    for (const l of budgetLignesRows.data ?? []) {
      const cat = l.categorie ?? 'Non catégorisé';
      distMap.set(cat, (distMap.get(cat) ?? 0) + Number(l.montant_prevu ?? 0));
    }
    const budgetDistribution = [...distMap.entries()]
      .map(([rubrique, montant]) => ({ rubrique, montant: Math.round(montant) }))
      .sort((a, b) => b.montant - a.montant);

    // ── getFundingSources ───────────────────────────────────────────────────
    const fsTotal = (fundingSourcesRows.data ?? []).reduce((s, f) => s + Number(f.montant), 0);
    const fundingSources = (fundingSourcesRows.data ?? []).map((f) => {
      const montant = Math.round(Number(f.montant));
      const pourcentage = f.pourcentage !== null
        ? Math.round(Number(f.pourcentage) * 100) / 100
        : fsTotal > 0 ? Math.round((montant / fsTotal) * 10000) / 100 : 0;
      return { source: f.nom, montant, pourcentage };
    });

    // ── getMilestones ───────────────────────────────────────────────────────
    const milestones = (milestonesRows.data ?? []).map((l) => ({
      id: l.id, titre: l.nom, datePrevue: l.date_prevue ?? null, statut: l.statut,
    }));

    return json({ summary, rowAggregation, topRisks, criticalActivities, disbursementsMonthly, budgetDistribution, fundingSources, milestones });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[project-detail-summary]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
