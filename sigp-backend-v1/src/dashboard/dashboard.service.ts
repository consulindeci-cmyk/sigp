import { Injectable } from '@nestjs/common';
import { LivrableStatus, PpmMarcheStatus, ProjectStatus, PtbaStatut } from '@prisma/client';
import { ProjectService } from '@/projects/project.service';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { PtbaService } from '@/ptba/ptba.service';
import { RisqueService } from '@/risques/risque.service';
import { PpmService } from '@/ppm/ppm.service';
import { PpmEtapeService } from '@/ppm-etapes/ppm-etape.service';
import { LivrableService } from '@/livrables/livrable.service';
import { DocumentService } from '@/documents/document.service';
import { ReportService } from '@/reports/report.service';
import { NotificationService } from '@/notifications/notification.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectQueryDto } from '@/projects/dto/project-query.dto';
import { BudgetVersionQueryDto } from '@/budget-versions/dto/budget-version-query.dto';
import { PtbaQueryDto } from '@/ptba/dto/ptba-query.dto';
import { RisqueQueryDto } from '@/risques/dto/risque-query.dto';
import { PpmQueryDto } from '@/ppm/dto/ppm-query.dto';
import { PpmEtapeQueryDto } from '@/ppm-etapes/dto/ppm-etape-query.dto';
import { LivrableQueryDto } from '@/livrables/dto/livrable-query.dto';
import { DocumentQueryDto } from '@/documents/dto/document-query.dto';
import { ReportQueryDto } from '@/reports/dto/report-query.dto';
import { NotificationQueryDto } from '@/notifications/dto/notification-query.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import {
  DashboardEvmDataPointDto,
  DashboardTimeSeriesItemDto,
  DashboardDistributionItemDto,
  DashboardCriticalActivityDto,
  DashboardMainRiskDto,
  DashboardMilestoneDto,
  DashboardEventDto,
  DashboardRecentActivityDto,
  DashboardUpcomingDeadlineDto,
  DashboardTimelineItemDto,
} from './dto/dashboard-analytics.dto';

const FR_MONTHS_SHORT = [
  'Jan.',
  'Fév.',
  'Mar.',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sep.',
  'Oct.',
  'Nov.',
  'Déc.',
];
const FR_MONTHS_ABBR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

function fmtMonthLabel(d: Date): string {
  return `${FR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtMonthAbbr(d: Date): string {
  return FR_MONTHS_ABBR[d.getMonth()];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function daysApart(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(past: Date, now: Date): string {
  const hoursAgo = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  if (hoursAgo < 1) return "À l'instant";
  if (hoursAgo < 24) return `Il y a ${hoursAgo}h`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo === 1 ? 'Hier' : `Il y a ${daysAgo}j`;
}

function relativeFuture(daysUntil: number): string {
  if (daysUntil <= 0) return "Aujourd'hui";
  if (daysUntil === 1) return 'Demain';
  return `Dans ${daysUntil} jours`;
}

function deadlineColorClass(daysUntil: number): string {
  if (daysUntil <= 3) return 'bg-destructive';
  if (daysUntil <= 7) return 'bg-warning';
  if (daysUntil <= 14) return 'bg-primary';
  return 'bg-muted-foreground';
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly budgetVersionService: BudgetVersionService,
    private readonly budgetLineService: BudgetLineService,
    private readonly ptbaService: PtbaService,
    private readonly risqueService: RisqueService,
    private readonly ppmService: PpmService,
    private readonly ppmEtapeService: PpmEtapeService,
    private readonly livrableService: LivrableService,
    private readonly documentService: DocumentService,
    private readonly reportService: ReportService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(userId: string, userRole: string): Promise<DashboardResponseDto> {
    let organisationId;
    if (userRole !== 'ADMIN') {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { organisation_id: true },
      });
      organisationId = dbUser?.organisation_id || undefined;
    }
    const now = new Date();
    const page1 = { page: 1, limit: 1, organisationId };
    const page1L100 = { page: 1, limit: 100, organisationId };

    // ── 12-month window for disbursements ──────────────────────────────────
    const since12M = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const orgFilter = organisationId
      ? {
          programme: { unite: { departement: { direction: { organisation_id: organisationId } } } },
        }
      : {};
    const orgFilterProject = organisationId
      ? {
          project: {
            programme: {
              unite: { departement: { direction: { organisation_id: organisationId } } },
            },
          },
        }
      : {};
    const orgFilterVersionProject = organisationId
      ? {
          version: {
            project: {
              programme: {
                unite: { departement: { direction: { organisation_id: organisationId } } },
              },
            },
          },
        }
      : {};

    // ── All queries in one Promise.all ──────────────────────────────────────
    const [
      // Existing KPI queries
      projetsTotal,
      projetsActifs,
      projetsTermines,
      projetsSuspendus,
      versionsResult,
      budgetAgg,
      ptbaTotal,
      ptbaTermines,
      ptbaEnCours,
      ptbaNonDemarres,
      risquesResult,
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
      // Analytics queries
      rawDisbursements,
      rawBudgetLignes,
      rawFundingSources,
      rawActivitesCritiques,
      rawRisquesPrincipaux,
      rawJalons,
      rawEcheances,
      rawNotificationsRecentes,
      rawTimelineActivites,
      rawTimelineContracts,
      rawEvmSnapshots,
      projectAgg,
      rawRisquesCategories,
    ] = await Promise.all([
      // ── KPI counts ────────────────────────────────────────────────────────
      this.projectService.findAll({ ...page1 } as ProjectQueryDto),
      this.projectService.findAll({ ...page1, statut: ProjectStatus.EN_COURS } as ProjectQueryDto),
      this.projectService.findAll({ ...page1, statut: ProjectStatus.CLOTURE } as ProjectQueryDto),
      this.projectService.findAll({ ...page1, statut: ProjectStatus.SUSPENDU } as ProjectQueryDto),
      this.budgetVersionService.findAll({ ...page1 } as BudgetVersionQueryDto),
      this.prisma.budgetLigne.aggregate({
        where: { deleted_at: null, ...orgFilterVersionProject },
        _sum: { montant_prevu: true, montant_engage: true, montant_paye: true },
        _count: { _all: true },
      }),
      this.ptbaService.findAll({ ...page1 } as PtbaQueryDto),
      this.ptbaService.findAll({ ...page1, statut: PtbaStatut.TERMINE } as PtbaQueryDto),
      this.ptbaService.findAll({ ...page1, statut: PtbaStatut.EN_COURS } as PtbaQueryDto),
      this.ptbaService.findAll({ ...page1, statut: PtbaStatut.NON_DEMARRE } as PtbaQueryDto),
      this.risqueService.findAll({ ...page1L100 } as RisqueQueryDto),
      this.ppmService.findAll({ ...page1 } as PpmQueryDto),
      this.ppmService.findAll({ ...page1, statut: PpmMarcheStatus.CLOTURE } as PpmQueryDto),
      this.ppmEtapeService.findAll({ ...page1 } as PpmEtapeQueryDto),
      this.livrableService.findAll({ ...page1 } as LivrableQueryDto),
      this.livrableService.findAll({ ...page1, statut: LivrableStatus.VALIDE } as LivrableQueryDto),
      this.livrableService.findAll({ ...page1, statut: LivrableStatus.SOUMIS } as LivrableQueryDto),
      this.documentService.findAll({ ...page1 } as DocumentQueryDto),
      this.reportService.findAll({ ...page1 } as ReportQueryDto),
      this.notificationService.findAll({ ...page1 } as NotificationQueryDto),
      this.notificationService.findAll({ ...page1, lue: false } as unknown as NotificationQueryDto),

      // ── Analytics direct Prisma queries ───────────────────────────────────

      // Décaissements 12 derniers mois
      this.prisma.disbursement.findMany({
        where: {
          ...orgFilterProject,
          OR: [{ date_reelle: { gte: since12M } }, { date_prevue: { gte: since12M } }],
        },
        select: { montant: true, date_reelle: true, date_prevue: true },
      }),

      // Budget lines pour répartition par catégorie
      this.prisma.budgetLigne.findMany({
        where: { deleted_at: null, ...orgFilterVersionProject },
        select: { categorie: true, montant_prevu: true },
      }),

      // Sources de financement
      this.prisma.fundingSource.findMany({
        where: { ...orgFilterProject },
        select: { nom: true, montant: true },
        orderBy: { montant: 'desc' },
        take: 10,
      }),

      // Activités critiques
      this.prisma.ptbaActivite.findMany({
        where: {
          ...orgFilterProject,
          OR: [
            { statut: PtbaStatut.EN_RETARD },
            {
              statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },
              date_fin_prevue: { lt: now },
            },
          ],
        },
        select: { id: true, code: true, libelle: true, statut: true, date_fin_prevue: true },
        orderBy: { date_fin_prevue: 'asc' },
        take: 10,
      }),

      // Risques principaux (CRITIQUE + ELEVE + MODERE)
      this.prisma.risque.findMany({
        where: {
          ...orgFilterProject,
          niveau_criticite: { in: ['CRITIQUE', 'ELEVE', 'MODERE'] },
        },
        select: { id: true, description: true, niveau_criticite: true, probabilite: true },
        take: 20,
      }),

      // Jalons (prochaines activités PTBA)
      this.prisma.ptbaActivite.findMany({
        where: {
          ...orgFilterProject,
          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },
          date_fin_prevue: { gte: now },
        },
        select: { id: true, libelle: true, date_fin_prevue: true, statut: true },
        orderBy: { date_fin_prevue: 'asc' },
        take: 5,
      }),

      // Échéances proches (top 10)
      this.prisma.ptbaActivite.findMany({
        where: {
          ...orgFilterProject,
          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },
          date_fin_prevue: { gte: now },
        },
        select: {
          id: true,
          libelle: true,
          date_fin_prevue: true,
          project: { select: { code: true } },
        },
        orderBy: { date_fin_prevue: 'asc' },
        take: 10,
      }),

      // Notifications récentes pour événements + activités récentes
      this.prisma.notification.findMany({
        where: { ...orgFilterProject },
        select: { id: true, titre: true, message: true, type: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),

      // Timeline — activités PTBA à venir
      this.prisma.ptbaActivite.findMany({
        where: {
          ...orgFilterProject,
          date_fin_prevue: { gte: now },
          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },
        },
        select: {
          id: true,
          libelle: true,
          date_fin_prevue: true,
          project: { select: { code: true } },
        },
        orderBy: { date_fin_prevue: 'asc' },
        take: 8,
      }),

      // Timeline — contrats à venir
      this.prisma.contract.findMany({
        where: {
          ...orgFilterProject,
          date_fin: { gte: now },
        },
        select: {
          id: true,
          intitule: true,
          date_fin: true,
          project: { select: { code: true } },
        },
        orderBy: { date_fin: 'asc' },
        take: 5,
      }),

      // EVM snapshots — toutes périodes, tous projets
      this.prisma.evmSnapshot.findMany({
        where: { ...orgFilterProject },
        select: { periode: true, pv: true, ev: true, ac: true },
        orderBy: { periode: 'asc' },
      }),

      // Project aggregations (e.g. sum of all project budget envelopes)
      this.prisma.project.aggregate({
        where: { deleted_at: null, ...orgFilter },
        _sum: { budget_total: true },
      }),

      // Répartition des risques par catégorie
      this.prisma.risque.groupBy({
        by: ['categorie'],
        where: {
          deleted_at: null,
          ...orgFilterProject,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    // ── Aggregate existing KPI fields ──────────────────────────────────────
    const budgetTotal = Number(projectAgg._sum.budget_total ?? budgetAgg._sum.montant_prevu ?? 0);
    const montantEngage = Number(budgetAgg._sum.montant_engage ?? 0);
    const montantPaye = Number(budgetAgg._sum.montant_paye ?? 0);
    const risquesCritiques = risquesResult.data.filter(
      (r) => r.niveauCriticite === 'CRITIQUE',
    ).length;
    const risquesEleves = risquesResult.data.filter((r) => r.niveauCriticite === 'ELEVE').length;

    // ── Build: Décaissements mensuels ──────────────────────────────────────
    const disbMap = new Map<string, number>();
    for (const d of rawDisbursements) {
      const date = d.date_reelle ?? d.date_prevue;
      if (!date) continue;
      const key = monthKey(date);
      disbMap.set(key, (disbMap.get(key) ?? 0) + Number(d.montant));
    }
    const decaissementsMensuels: DashboardTimeSeriesItemDto[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      decaissementsMensuels.push({
        label: fmtMonthAbbr(d),
        value: Math.round(((disbMap.get(key) ?? 0) / 1_000_000) * 10) / 10,
      });
    }

    // ── Build: Budget distribution ─────────────────────────────────────────
    const BUDGET_COLORS = ['primary', 'success', 'warning', 'destructive', 'muted-foreground'];
    const budgetCatMap = new Map<string, number>();
    for (const l of rawBudgetLignes) {
      const cat = l.categorie ?? 'Autre';
      budgetCatMap.set(cat, (budgetCatMap.get(cat) ?? 0) + Number(l.montant_prevu));
    }
    const totalBudgetLignesVal = Array.from(budgetCatMap.values()).reduce((a, b) => a + b, 0) || 1;
    const budgetDistribution: DashboardDistributionItemDto[] = Array.from(budgetCatMap.entries())
      .map(([label, value], idx) => ({
        label,
        value,
        percent: Math.round((value / totalBudgetLignesVal) * 100) || 0,
        color: BUDGET_COLORS[idx % BUDGET_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ── Build: Financement distribution ───────────────────────────────────
    const FUNDING_COLORS = ['primary', 'success', 'warning', 'muted-foreground', 'destructive'];
    const totalFinancementVal = rawFundingSources.reduce((a, b) => a + Number(b.montant), 0) || 1;
    const financementDistribution: DashboardDistributionItemDto[] = rawFundingSources
      .map((f, idx) => {
        const value = Number(f.montant);
        return {
          label: f.nom,
          value,
          percent: Math.round((value / totalFinancementVal) * 100) || 0,
          color: FUNDING_COLORS[idx % FUNDING_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    // ── Build: Risques par catégorie ──────────────────────────────────────
    const RISK_COLORS = ['destructive', 'warning', 'primary', 'success', 'muted-foreground'];
    const totalRisquesCount = Number(risquesResult.meta.total ?? 1);
    const risquesParCategorie: DashboardDistributionItemDto[] = rawRisquesCategories
      .map((item, idx) => {
        const value = item._count._all;
        const label = item.categorie || 'Opérationnel';
        const percent = Math.round((value / totalRisquesCount) * 100) || 0;
        return {
          label,
          value,
          percent,
          color: RISK_COLORS[idx % RISK_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    // ── Build: Activités critiques ─────────────────────────────────────────
    const activitesCritiques: DashboardCriticalActivityDto[] = rawActivitesCritiques.map((a) => {
      const delayDays = a.date_fin_prevue ? Math.max(0, daysApart(a.date_fin_prevue, now)) : 0;
      return {
        id: a.id,
        code: a.code,
        name: a.libelle,
        status: a.statut === PtbaStatut.EN_RETARD ? 'delayed' : 'blocked',
        delayDays,
      };
    });

    // ── Build: Risques principaux ──────────────────────────────────────────
    const CRITICITE_ORDER: Record<string, number> = { CRITIQUE: 0, ELEVE: 1, MODERE: 2, FAIBLE: 3 };
    const PROB_TO_PCT: Record<string, number> = {
      FAIBLE: 25,
      POSSIBLE: 50,
      PROBABLE: 75,
      QUASI_CERTAIN: 95,
    };
    const NIVEAU_TO_LEVEL = (n: string): 'high' | 'medium' | 'low' =>
      n === 'CRITIQUE' || n === 'ELEVE' ? 'high' : n === 'MODERE' ? 'medium' : 'low';

    const risquesPrincipaux: DashboardMainRiskDto[] = rawRisquesPrincipaux
      .sort(
        (a, b) =>
          (CRITICITE_ORDER[a.niveau_criticite] ?? 9) - (CRITICITE_ORDER[b.niveau_criticite] ?? 9),
      )
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        description: r.description,
        probability: PROB_TO_PCT[r.probabilite] ?? 50,
        level: NIVEAU_TO_LEVEL(r.niveau_criticite),
      }));

    // ── Build: Jalons ──────────────────────────────────────────────────────
    const jalons: DashboardMilestoneDto[] = rawJalons.map((j) => ({
      id: j.id,
      title: j.libelle,
      date: j.date_fin_prevue ? j.date_fin_prevue.toISOString().slice(0, 10) : '',
      status:
        j.statut === PtbaStatut.TERMINE
          ? 'achieved'
          : j.statut === PtbaStatut.EN_RETARD
            ? 'delayed'
            : 'pending',
    }));

    // ── Build: Événements récents (from notifications) ─────────────────────
    const NOTIF_TYPE_MAP: Record<string, DashboardEventDto['type']> = {
      RISQUE_CRITIQUE: 'alert',
      BUDGET_DEPASSE: 'alert',
      EVM_ALERTE_CPI: 'alert',
      EVM_ALERTE_SPI: 'alert',
      CONTRAT_EXPIRE: 'alert',
      LIVRABLE_EN_RETARD: 'alert',
      DOCUMENT_VALIDE: 'validation',
      RAPPORT_PRET: 'validation',
      BUDGET_VALIDE: 'validation',
      PAIEMENT_DU: 'payment',
      CONTRAT_SIGNE: 'payment',
    };
    const evenementsRecents: DashboardEventDto[] = rawNotificationsRecentes
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        description: n.message,
        date: n.created_at.toISOString().slice(0, 10),
        type: NOTIF_TYPE_MAP[n.type] ?? 'milestone',
      }));

    // ── Build: Activités récentes (from notifications) ─────────────────────
    const NOTIF_COLOR: Record<string, string> = {
      RISQUE_CRITIQUE: 'bg-destructive',
      BUDGET_DEPASSE: 'bg-destructive',
      EVM_ALERTE_CPI: 'bg-destructive',
      LIVRABLE_EN_RETARD: 'bg-warning',
      CONTRAT_EXPIRE: 'bg-warning',
      DOCUMENT_VALIDE: 'bg-success',
      RAPPORT_PRET: 'bg-success',
      BUDGET_VALIDE: 'bg-success',
    };
    const activitesRecentes: DashboardRecentActivityDto[] = rawNotificationsRecentes
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.titre,
        meta: n.message,
        time: relativeTime(n.created_at, now),
        colorClass: NOTIF_COLOR[n.type] ?? 'bg-primary',
      }));

    // ── Build: Échéances proches ───────────────────────────────────────────
    const echeancesProches: DashboardUpcomingDeadlineDto[] = rawEcheances.map((u) => {
      const days = u.date_fin_prevue ? Math.max(0, daysApart(now, u.date_fin_prevue)) : 0;
      return {
        id: u.id,
        title: u.libelle,
        meta: (u as { project?: { code: string } }).project?.code ?? '',
        time: relativeFuture(days),
        colorClass: deadlineColorClass(days),
      };
    });

    // ── Build: Timeline ────────────────────────────────────────────────────
    const timelineRaw: DashboardTimelineItemDto[] = [
      ...rawTimelineActivites
        .filter((a) => a.date_fin_prevue)
        .map((a) => ({
          id: a.id,
          title: a.libelle,
          date: fmtMonthLabel(a.date_fin_prevue!),
          project: (a as { project?: { code: string } }).project?.code ?? '',
          type: 'deadline' as const,
          _sort: a.date_fin_prevue!.getTime(),
        })),
      ...rawTimelineContracts
        .filter((c) => c.date_fin)
        .map((c) => ({
          id: c.id,
          title: c.intitule,
          date: fmtMonthLabel(c.date_fin!),
          project: (c as { project?: { code: string } }).project?.code ?? '',
          type: 'milestone' as const,
          _sort: c.date_fin!.getTime(),
        })),
    ]
      .sort((a, b) => (a as { _sort: number })._sort - (b as { _sort: number })._sort)
      .slice(0, 10)
      .map(({ id, title, date, project, type }) => ({ id, title, date, project, type }));

    const timeline: DashboardTimelineItemDto[] = timelineRaw;

    // ── Build: EVM data (agrégé par période sur tout le portefeuille) ───────
    const evmPeriodMap = new Map<string, { pv: number; ev: number; ac: number }>();
    for (const snap of rawEvmSnapshots) {
      const existing = evmPeriodMap.get(snap.periode) ?? { pv: 0, ev: 0, ac: 0 };
      evmPeriodMap.set(snap.periode, {
        pv: existing.pv + Number(snap.pv),
        ev: existing.ev + Number(snap.ev),
        ac: existing.ac + Number(snap.ac),
      });
    }
    const evmData: DashboardEvmDataPointDto[] = Array.from(evmPeriodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periode, vals]) => ({
        date: periode,
        pv: Math.round(vals.pv / 1000),
        ev: Math.round(vals.ev / 1000),
        ac: Math.round(vals.ac / 1000),
      }));

    const totalProj = Number(projetsTotal.meta.total ?? 0);
    const actifsProj = Number(projetsActifs.meta.total ?? 0);
    const terminesProj = Number(projetsTermines.meta.total ?? 0);

    return {
      projets: {
        total: totalProj,
        actifs: actifsProj,
        termines: terminesProj,
        suspendus: projetsSuspendus.meta.total,
        pctActifs: totalProj ? Math.round((actifsProj / totalProj) * 100) : 0,
        pctTermines: totalProj ? Math.round((terminesProj / totalProj) * 100) : 0,
      },
      finances: {
        budgetTotal,
        montantEngage,
        montantPaye,
        montantRestant: budgetTotal - montantPaye,
        nombreVersions: versionsResult.meta.total,
        nombreLignes: budgetAgg._count._all,
        tauxDecaissement: budgetTotal ? `${((montantPaye / budgetTotal) * 100).toFixed(1)}%` : '0%',
        percentEngaged: budgetTotal ? Math.round((montantEngage / budgetTotal) * 100) : 0,
        percentDisbursed: budgetTotal ? Math.round((montantPaye / budgetTotal) * 100) : 0,
        nombreBailleurs: rawFundingSources.length,
      },
      risques: {
        total: risquesResult.meta.total,
        critiques: risquesCritiques,
        eleves: risquesEleves,
      },
      passation: {
        marchesTotal: marchesTotal.meta.total,
        marchesTermines: marchesTermines.meta.total,
        marchesEnCours: marchesTotal.meta.total - marchesTermines.meta.total,
        etapesTotal: etapesTotal.meta.total,
      },
      overview: {
        ptbaTotal: ptbaTotal.meta.total,
        ptbaTermines: ptbaTermines.meta.total,
        ptbaEnCours: ptbaEnCours.meta.total,
        ptbaNonDemarres: ptbaNonDemarres.meta.total,
        livrablesTotal: livrablesTotal.meta.total,
        livrablesValides: livrablesValides.meta.total,
        livrablesSoumis: livrablesSoumis.meta.total,
        documentsTotal: documentsTotal.meta.total,
        rapportsTotal: rapportsTotal.meta.total,
        notificationsTotal: notificationsTotal.meta.total,
        notificationsNonLues: notificationsNonLues.meta.total,
      },
      evmData,
      decaissementsMensuels,
      budgetDistribution,
      financementDistribution,
      activitesCritiques,
      risquesPrincipaux,
      risquesParCategorie,
      jalons,
      evenementsRecents,
      activitesRecentes,
      echeancesProches,
      timeline,
      generatedAt: new Date(),
    };
  }
}
