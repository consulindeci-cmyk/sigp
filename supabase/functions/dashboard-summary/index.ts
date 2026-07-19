import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize } from '../_shared/authorize.ts';
import { buildUserScopedClient } from '../_shared/user-scoped-client.ts';
import {
  fmtMonthAbbr,
  fmtMonthLabel,
  monthKey,
  daysApart,
  relativeTime,
  relativeFuture,
  deadlineColorClass,
  NOTIF_TYPE_MAP,
  NOTIF_COLOR,
  CRITICITE_ORDER,
  PROB_TO_PCT,
  niveauToLevel,
  DISTRIBUTION_COLORS,
} from '../_shared/dashboard-format.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Lecture seule, agrégation portée fidèlement depuis
// sigp-backend-v1/src/dashboard/dashboard.service.ts.
//
// Déviation architecturale délibérée (validée par l'utilisateur) : contrairement
// à toutes les autres Edge Functions du projet, celle-ci N'UTILISE PAS le
// client service_role pour les requêtes de données. Elle construit un client
// avec le JWT de l'appelant (authClient) afin que CHAQUE requête soit filtrée
// automatiquement par les policies RLS déjà en place sur chaque table
// (is_admin() OR organisation correspondante) — au lieu de recopier à la main
// la logique orgFilter/orgFilterProject/orgFilterVersionProject de NestJS.
// authorize() (service_role) sert uniquement à valider le JWT et vérifier que
// le compte n'est pas désactivé/supprimé, jamais à lire les données du dashboard.
//
// Déviation de comportement assumée : les compteurs de notifications sont ici
// scopés par PROPRIÉTAIRE (policy RLS notifications_select : user_id =
// current_app_user_id()), pas par organisation comme le faisait NestJS —
// cohérent avec la sémantique "mes notifications", plus logique pour un badge
// personnel qu'un total à l'échelle de l'organisation.
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    await authorize(req); // authentification uniquement — pas de restriction de rôle (comme @ApiAuth(VIEWER) côté NestJS)
    const db = buildUserScopedClient(req);

    const now = new Date();
    const nowIso = now.toISOString();
    const since12M = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const since12MIso = since12M.toISOString();

    const [
      projetsTotal,
      projetsActifs,
      projetsTermines,
      projetsSuspendus,
      projetsBudget,
      versionsTotal,
      budgetLignesRows,
      ptbaTotal,
      ptbaTermines,
      ptbaEnCours,
      ptbaNonDemarres,
      risquesTotal,
      risquesRows,
      risquesPrincipauxRows,
      marchesTotal,
      marchesTermines,
      etapesTotal,
      livrablesTotal,
      livrablesValides,
      livrablesSoumis,
      documentsTotal,
      rapportsTotal,
      notificationsTotal,
      notificationsNonLues,
      disbursementsRows,
      disbursementsHorsLigneRows,
      fundingSourcesRows,
      activitesCritiquesRows,
      jalonsRows,
      echeancesRows,
      notificationsRecentesRows,
      timelineActivitesRows,
      timelineContractsRows,
      evmSnapshotsRows,
    ] = await Promise.all([
      db.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'EN_COURS'),
      db.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'CLOTURE'),
      db.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'SUSPENDU'),
      db.from('projects').select('budget_total').is('deleted_at', null),
      db.from('budget_versions').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('budget_lignes').select('categorie, montant_prevu, montant_engage, montant_paye').is('deleted_at', null),
      db.from('ptba_activites').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('ptba_activites').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'TERMINE'),
      db.from('ptba_activites').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'EN_COURS'),
      db.from('ptba_activites').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'NON_DEMARRE'),
      db.from('risques').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('risques').select('id, description, niveau_criticite, probabilite, categorie').is('deleted_at', null).limit(200),
      db.from('risques').select('id, description, niveau_criticite, probabilite').is('deleted_at', null)
        .in('niveau_criticite', ['CRITIQUE', 'ELEVE', 'MODERE']).limit(20),
      db.from('ppm_marches').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('ppm_marches').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'CLOTURE'),
      db.from('ppm_etapes').select('*', { count: 'exact', head: true }),
      db.from('livrables').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('livrables').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'VALIDE'),
      db.from('livrables').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'SOUMIS'),
      db.from('documents_projet').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('rapports_projet').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('notifications').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('notifications').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('lue', false),
      db.from('disbursements').select('montant, date_reelle, date_prevue')
        .or(`date_reelle.gte.${since12MIso},date_prevue.gte.${since12MIso}`),
      // Même correctif que project-detail-summary : budget_lignes.montant_paye
      // ne capture que les décaissements DECAISSE rattachés à une Ligne
      // Budgétaire — un décaissement DECAISSE lié seulement à un Contrat/une
      // Source de financement (sans budget_ligne_id) est un vrai paiement,
      // exclu sinon du "Taux de décaissement" portefeuille.
      db.from('disbursements').select('montant').eq('statut', 'DECAISSE').is('budget_ligne_id', null),
      db.from('funding_sources').select('nom, montant').order('montant', { ascending: false }).limit(10),
      db.from('ptba_activites').select('id, code, libelle, statut, date_fin_prevue')
        .or(`statut.eq.EN_RETARD,and(statut.not.in.(TERMINE,ANNULE),date_fin_prevue.lt.${nowIso})`)
        .order('date_fin_prevue', { ascending: true }).limit(10),
      db.from('ptba_activites').select('id, libelle, date_fin_prevue, statut')
        .not('statut', 'in', '(TERMINE,ANNULE)').gte('date_fin_prevue', nowIso)
        .order('date_fin_prevue', { ascending: true }).limit(5),
      db.from('ptba_activites').select('id, libelle, date_fin_prevue, project:projects(code)')
        .not('statut', 'in', '(TERMINE,ANNULE)').gte('date_fin_prevue', nowIso)
        .order('date_fin_prevue', { ascending: true }).limit(10),
      db.from('notifications').select('id, titre, message, type, created_at').order('created_at', { ascending: false }).limit(10),
      db.from('ptba_activites').select('id, libelle, date_fin_prevue, project:projects(code)')
        .not('statut', 'in', '(TERMINE,ANNULE)').gte('date_fin_prevue', nowIso)
        .order('date_fin_prevue', { ascending: true }).limit(8),
      db.from('contracts').select('id, intitule, date_fin, project:projects(code)')
        .gte('date_fin', nowIso).order('date_fin', { ascending: true }).limit(5),
      db.from('evm_snapshots').select('periode, pv, ev, ac').order('periode', { ascending: true }),
    ]);

    for (const [name, res] of Object.entries({
      projetsTotal, projetsActifs, projetsTermines, projetsSuspendus, projetsBudget, versionsTotal,
      budgetLignesRows, ptbaTotal, ptbaTermines, ptbaEnCours, ptbaNonDemarres, risquesTotal, risquesRows,
      risquesPrincipauxRows, marchesTotal, marchesTermines, etapesTotal, livrablesTotal, livrablesValides,
      livrablesSoumis, documentsTotal, rapportsTotal, notificationsTotal, notificationsNonLues,
      disbursementsRows, disbursementsHorsLigneRows, fundingSourcesRows, activitesCritiquesRows, jalonsRows, echeancesRows,
      notificationsRecentesRows, timelineActivitesRows, timelineContractsRows, evmSnapshotsRows,
    })) {
      if (res.error) throw new Error(`[${name}] ${res.error.message}`);
    }

    // ── KPIs simples ────────────────────────────────────────────────────────
    const totalProj = projetsTotal.count ?? 0;
    const actifsProj = projetsActifs.count ?? 0;
    const terminesProj = projetsTermines.count ?? 0;

    const budgetTotal = (projetsBudget.data ?? []).reduce((s, p) => s + Number(p.budget_total ?? 0), 0)
      || (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_prevu ?? 0), 0);
    const montantEngage = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_engage ?? 0), 0);
    const montantPayeLignes = (budgetLignesRows.data ?? []).reduce((s, l) => s + Number(l.montant_paye ?? 0), 0);
    const montantPayeHorsLigne = (disbursementsHorsLigneRows.data ?? []).reduce((s, d) => s + Number(d.montant ?? 0), 0);
    const montantPaye = montantPayeLignes + montantPayeHorsLigne;

    const risquesCritiques = (risquesRows.data ?? []).filter((r) => r.niveau_criticite === 'CRITIQUE').length;
    const risquesEleves = (risquesRows.data ?? []).filter((r) => r.niveau_criticite === 'ELEVE').length;

    // ── Décaissements mensuels (12 derniers mois) ──────────────────────────
    const disbMap = new Map<string, number>();
    for (const d of disbursementsRows.data ?? []) {
      const date = d.date_reelle ?? d.date_prevue;
      if (!date) continue;
      const key = monthKey(new Date(date));
      disbMap.set(key, (disbMap.get(key) ?? 0) + Number(d.montant));
    }
    const decaissementsMensuels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      decaissementsMensuels.push({ label: fmtMonthAbbr(d), value: Math.round(((disbMap.get(key) ?? 0) / 1_000_000) * 10) / 10 });
    }

    // ── Répartition budget par catégorie ───────────────────────────────────
    const budgetCatMap = new Map<string, number>();
    for (const l of budgetLignesRows.data ?? []) {
      const cat = l.categorie ?? 'Autre';
      budgetCatMap.set(cat, (budgetCatMap.get(cat) ?? 0) + Number(l.montant_prevu));
    }
    const totalBudgetLignesVal = Array.from(budgetCatMap.values()).reduce((a, b) => a + b, 0) || 1;
    const budgetDistribution = Array.from(budgetCatMap.entries())
      .map(([label, value], idx) => ({ label, value, percent: Math.round((value / totalBudgetLignesVal) * 100) || 0, color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length] }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    // ── Répartition financements ────────────────────────────────────────────
    const totalFinancementVal = (fundingSourcesRows.data ?? []).reduce((a, f) => a + Number(f.montant), 0) || 1;
    const financementDistribution = (fundingSourcesRows.data ?? [])
      .map((f, idx) => {
        const value = Number(f.montant);
        return { label: f.nom, value, percent: Math.round((value / totalFinancementVal) * 100) || 0, color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length] };
      }).sort((a, b) => b.value - a.value);

    // ── Répartition risques par catégorie ──────────────────────────────────
    const riskCatMap = new Map<string, number>();
    for (const r of risquesRows.data ?? []) {
      const cat = r.categorie || 'Opérationnel';
      riskCatMap.set(cat, (riskCatMap.get(cat) ?? 0) + 1);
    }
    const totalRisquesCount = risquesTotal.count || 1;
    const risquesParCategorie = Array.from(riskCatMap.entries())
      .map(([label, value], idx) => ({ label, value, percent: Math.round((value / totalRisquesCount) * 100) || 0, color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    // ── Activités critiques ─────────────────────────────────────────────────
    const activitesCritiques = (activitesCritiquesRows.data ?? []).map((a) => ({
      id: a.id,
      code: a.code,
      name: a.libelle,
      status: a.statut === 'EN_RETARD' ? 'delayed' : 'blocked',
      delayDays: a.date_fin_prevue ? Math.max(0, daysApart(new Date(a.date_fin_prevue), now)) : 0,
    }));

    // ── Risques principaux ──────────────────────────────────────────────────
    const risquesPrincipaux = (risquesPrincipauxRows.data ?? [])
      .sort((a, b) => (CRITICITE_ORDER[a.niveau_criticite] ?? 9) - (CRITICITE_ORDER[b.niveau_criticite] ?? 9))
      .slice(0, 5)
      .map((r) => ({ id: r.id, description: r.description, probability: PROB_TO_PCT[r.probabilite] ?? 50, level: niveauToLevel(r.niveau_criticite) }));

    // ── Jalons ───────────────────────────────────────────────────────────────
    const jalons = (jalonsRows.data ?? []).map((j) => ({
      id: j.id,
      title: j.libelle,
      date: j.date_fin_prevue ? String(j.date_fin_prevue).slice(0, 10) : '',
      status: j.statut === 'TERMINE' ? 'achieved' : j.statut === 'EN_RETARD' ? 'delayed' : 'pending',
    }));

    // ── Événements / activités récentes (notifications PERSONNELLES) ───────
    const evenementsRecents = (notificationsRecentesRows.data ?? []).slice(0, 5).map((n) => ({
      id: n.id, description: n.message, date: String(n.created_at).slice(0, 10), type: NOTIF_TYPE_MAP[n.type] ?? 'milestone',
    }));
    const activitesRecentes = (notificationsRecentesRows.data ?? []).slice(0, 5).map((n) => ({
      id: n.id, title: n.titre, meta: n.message, time: relativeTime(new Date(n.created_at), now), colorClass: NOTIF_COLOR[n.type] ?? 'bg-primary',
    }));

    // ── Échéances proches ────────────────────────────────────────────────────
    const echeancesProches = (echeancesRows.data ?? []).map((u: { id: string; libelle: string; date_fin_prevue: string | null; project?: { code: string } | { code: string }[] }) => {
      const days = u.date_fin_prevue ? Math.max(0, daysApart(now, new Date(u.date_fin_prevue))) : 0;
      const project = Array.isArray(u.project) ? u.project[0] : u.project;
      return { id: u.id, title: u.libelle, meta: project?.code ?? '', time: relativeFuture(days), colorClass: deadlineColorClass(days) };
    });

    // ── Timeline (activités + contrats fusionnés) ──────────────────────────
    type TimelineRaw = { id: string; title: string; date: string; project: string; type: 'deadline' | 'milestone'; _sort: number };
    const timelineActivites: TimelineRaw[] = (timelineActivitesRows.data ?? [])
      .filter((a: { date_fin_prevue: string | null }) => a.date_fin_prevue)
      .map((a: { id: string; libelle: string; date_fin_prevue: string; project?: { code: string } | { code: string }[] }) => {
        const d = new Date(a.date_fin_prevue);
        const project = Array.isArray(a.project) ? a.project[0] : a.project;
        return { id: a.id, title: a.libelle, date: fmtMonthLabel(d), project: project?.code ?? '', type: 'deadline' as const, _sort: d.getTime() };
      });
    const timelineContracts: TimelineRaw[] = (timelineContractsRows.data ?? [])
      .filter((c: { date_fin: string | null }) => c.date_fin)
      .map((c: { id: string; intitule: string; date_fin: string; project?: { code: string } | { code: string }[] }) => {
        const d = new Date(c.date_fin);
        const project = Array.isArray(c.project) ? c.project[0] : c.project;
        return { id: c.id, title: c.intitule, date: fmtMonthLabel(d), project: project?.code ?? '', type: 'milestone' as const, _sort: d.getTime() };
      });
    const timeline = [...timelineActivites, ...timelineContracts]
      .sort((a, b) => a._sort - b._sort).slice(0, 10)
      .map(({ id, title, date, project, type }) => ({ id, title, date, project, type }));

    // ── EVM agrégé par période (portefeuille) ──────────────────────────────
    const evmPeriodMap = new Map<string, { pv: number; ev: number; ac: number }>();
    for (const snap of evmSnapshotsRows.data ?? []) {
      const existing = evmPeriodMap.get(snap.periode) ?? { pv: 0, ev: 0, ac: 0 };
      evmPeriodMap.set(snap.periode, { pv: existing.pv + Number(snap.pv), ev: existing.ev + Number(snap.ev), ac: existing.ac + Number(snap.ac) });
    }
    const evmData = Array.from(evmPeriodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periode, vals]) => ({ date: periode, pv: Math.round(vals.pv / 1000), ev: Math.round(vals.ev / 1000), ac: Math.round(vals.ac / 1000) }));

    return json({
      projets: {
        total: totalProj, actifs: actifsProj, termines: terminesProj, suspendus: projetsSuspendus.count ?? 0,
        pctActifs: totalProj ? Math.round((actifsProj / totalProj) * 100) : 0,
        pctTermines: totalProj ? Math.round((terminesProj / totalProj) * 100) : 0,
      },
      finances: {
        budgetTotal, montantEngage, montantPaye, montantRestant: budgetTotal - montantPaye,
        nombreVersions: versionsTotal.count ?? 0, nombreLignes: (budgetLignesRows.data ?? []).length,
        tauxDecaissement: budgetTotal ? `${((montantPaye / budgetTotal) * 100).toFixed(1)}%` : '0%',
        percentEngaged: budgetTotal ? Math.round((montantEngage / budgetTotal) * 100) : 0,
        percentDisbursed: budgetTotal ? Math.round((montantPaye / budgetTotal) * 100) : 0,
        nombreBailleurs: (fundingSourcesRows.data ?? []).length,
      },
      risques: { total: risquesTotal.count ?? 0, critiques: risquesCritiques, eleves: risquesEleves },
      passation: {
        marchesTotal: marchesTotal.count ?? 0, marchesTermines: marchesTermines.count ?? 0,
        marchesEnCours: (marchesTotal.count ?? 0) - (marchesTermines.count ?? 0), etapesTotal: etapesTotal.count ?? 0,
      },
      overview: {
        ptbaTotal: ptbaTotal.count ?? 0, ptbaTermines: ptbaTermines.count ?? 0, ptbaEnCours: ptbaEnCours.count ?? 0,
        ptbaNonDemarres: ptbaNonDemarres.count ?? 0, livrablesTotal: livrablesTotal.count ?? 0,
        livrablesValides: livrablesValides.count ?? 0, livrablesSoumis: livrablesSoumis.count ?? 0,
        documentsTotal: documentsTotal.count ?? 0, rapportsTotal: rapportsTotal.count ?? 0,
        notificationsTotal: notificationsTotal.count ?? 0, notificationsNonLues: notificationsNonLues.count ?? 0,
      },
      evmData, decaissementsMensuels, budgetDistribution, financementDistribution,
      activitesCritiques, risquesPrincipaux, risquesParCategorie, jalons,
      evenementsRecents, activitesRecentes, echeancesProches, timeline,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[dashboard-summary]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
