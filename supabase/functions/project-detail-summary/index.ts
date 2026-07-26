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
      contratsRows,
      risquesRows,
      wbsRootCount,
      budgetVersionIdsRows,
      fundingSourcesRows,
      milestonesRows,
      criticalActivitiesRows,
      evmRes,
    ] = await Promise.all([
      // Seule la version budgétaire APPROUVE fait foi (cf. audit EVM :
      // sommer toutes les versions vivantes — BROUILLON/EN_REVISION/ARCHIVE
      // confondues — double-comptait le budget dès qu'un projet avait plus
      // d'une version simultanée). Même règle que calculate_project_evm().
      db.from('budget_lignes').select('categorie, montant_prevu, montant_engage, montant_paye, version:budget_versions!inner(project_id)')
        .is('deleted_at', null).eq('version.project_id', body.projectId).eq('version.statut', 'APPROUVE'),
      db.from('ptba_activites').select('statut, taux_realisation').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('contracts').select('id, statut').is('deleted_at', null).eq('project_id', body.projectId),
      db.from('risques').select('id, description, niveau_criticite, probabilite, impact, strategie, statut')
        .is('deleted_at', null).eq('project_id', body.projectId),
      db.from('wbs_nodes').select('*', { count: 'exact', head: true }).is('deleted_at', null)
        .eq('project_id', body.projectId).is('parent_id', null),
      // Idem : seuls les décaissements rattachés à la version APPROUVE via
      // budget_version_id doivent compter comme "réels" (cf. commentaire ci-dessus).
      db.from('budget_versions').select('id').is('deleted_at', null).eq('project_id', body.projectId).eq('statut', 'APPROUVE'),
      db.from('funding_sources').select('id, nom, montant, pourcentage').eq('project_id', body.projectId).order('montant', { ascending: false }),
      // Jalons — rebasés sur les échéances des activités PTBA (le module
      // Livrables a été supprimé) : une activité fait office de jalon via sa
      // date de fin prévue, comme partout ailleurs (activités critiques,
      // échéances proches côté dashboard-summary).
      db.from('ptba_activites').select('id, libelle, date_fin_prevue, statut')
        .is('deleted_at', null).eq('project_id', body.projectId).order('date_fin_prevue', { ascending: true }),
      db.from('ptba_activites').select('id, code, libelle, responsable_id, statut, taux_realisation, date_fin_prevue')
        .eq('project_id', body.projectId)
        .or(`statut.eq.EN_RETARD,and(statut.not.in.(TERMINE,ANNULE),date_fin_prevue.lt.${new Date().toISOString()})`),
      // Même fonction unifiée que l'onglet EVM (calculate_project_evm) — évite
      // que "Physique" affiche ici une moyenne non pondérée différente du
      // vrai EV/BAC montré une fois sur l'onglet EVM (cf. audit).
      db.rpc('calculate_project_evm', { p_project_id: body.projectId }).single(),
    ]);

    for (const [name, res] of Object.entries({
      budgetLignesRows, ptbaRows, contratsRows, risquesRows, wbsRootCount,
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
      ? await db.from('disbursements').select('montant, statut, date_prevue, date_reelle, budget_ligne_id').or(disbOrClauses.join(','))
      : { data: [] as { montant: number; statut: string; date_prevue: string | null; date_reelle: string | null; budget_ligne_id: string | null }[], error: null };
    if (disbursementsRows.error) throw disbursementsRows.error;

    // ── getSummary ──────────────────────────────────────────────────────────
    const budgetTotal = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_prevu ?? 0), 0);
    const montantEngage = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_engage ?? 0), 0);
    // budget_lignes.montant_paye (recalc_budget_ligne_montants) ne somme que
    // les décaissements DECAISSE rattachés à une Ligne Budgétaire — un
    // décaissement DECAISSE lié seulement à un Contrat et/ou une Source de
    // financement (sans budget_ligne_id) est un vrai paiement mais restait
    // invisible ici, créant un écart avec le taux affiché dans l'onglet
    // Décaissements (constat utilisateur). Ajouté explicitement, en excluant
    // par `budget_ligne_id` pour ne jamais compter deux fois un décaissement
    // qui aurait à la fois une ligne et un contrat.
    const montantPayeLignes = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_paye ?? 0), 0);
    const montantPayeHorsLigne = (disbursementsRows.data ?? [])
      .filter((d) => d.statut === 'DECAISSE' && !d.budget_ligne_id)
      .reduce((s, d) => s + Number(d.montant ?? 0), 0);
    const montantPaye = montantPayeLignes + montantPayeHorsLigne;
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

    const contratsList = contratsRows.data ?? [];
    const nombreContrats = contratsList.length;
    const contratsActifs = contratsList.filter((c) => c.statut === 'ACTIF').length;

    const risquesList = risquesRows.data ?? [];
    const nombreRisques = risquesList.length;
    // ELEVE = palier haut du modèle 3×3 (remplace CRITIQUE) — l'ancienne
    // valeur reste acceptée pour les risques jamais réenregistrés depuis
    // l'unification du scoring (cf. _shared/risk-scoring.ts).
    const risquesCritiques = risquesList.filter((r) => r.niveau_criticite === 'ELEVE' || r.niveau_criticite === 'CRITIQUE').length;

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
    };

    // ── getTopRisks ─────────────────────────────────────────────────────────
    // Probabilité 3×3 : '1'/'2'/'3' — anciennes valeurs textuelles encore
    // acceptées pour les risques jamais réenregistrés depuis l'unification
    // du scoring (cf. _shared/risk-scoring.ts).
    const PROB_ORDER: Record<string, number> = {
      '3': 3, '2': 2, '1': 1,
      QUASI_CERTAIN: 3, PROBABLE: 2, POSSIBLE: 1, FAIBLE: 0,
    };
    const topRisks = [...risquesList]
      .sort((a, b) => {
        const aCrit = a.niveau_criticite === 'ELEVE' || a.niveau_criticite === 'CRITIQUE' ? 1 : 0;
        const bCrit = b.niveau_criticite === 'ELEVE' || b.niveau_criticite === 'CRITIQUE' ? 1 : 0;
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
    // Rebasé sur les activités PTBA (module Livrables supprimé) — statut
    // traduit vers le même vocabulaire attendu par le frontend
    // (TabOverview.tsx : 'VALIDE' → achieved, 'EN_RETARD' → delayed, sinon
    // pending), pour ne rien changer côté widget Jalons.
    const milestones = (milestonesRows.data ?? []).map((a) => ({
      id: a.id, titre: a.libelle, datePrevue: a.date_fin_prevue ?? null,
      statut: a.statut === 'TERMINE' ? 'VALIDE' : a.statut,
    }));

    return json({ summary, rowAggregation, topRisks, criticalActivities, disbursementsMonthly, budgetDistribution, fundingSources, milestones });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[project-detail-summary]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
