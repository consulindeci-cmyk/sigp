import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  Disbursement,
  FundingSource,
  Livrable,
  LivrableStatus,
  Prisma,
  Project,
  ProjectStatus,
  PtbaStatut,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export const PROJECT_INCLUDE = {
  manager: { select: { id: true, nom: true, prenom: true } },
} as const;

export type ProjectWithManager = Prisma.ProjectGetPayload<{
  include: typeof PROJECT_INCLUDE;
}>;

export interface ProjectAggregationsSummary {
  progressScore: number;
  profileScore?: number;
  tauxDecaissement: number;
  composantes: number;
  activites: number;
  livrables: number;
}

export interface CreateProjectData {
  programmeId?: string;
  code: string;
  nom: string;
  description?: string | null;
  statut: ProjectStatus;
  managerId?: string | null;
  dateDebut?: Date | null;
  dateFinPrevue?: Date | null;
  budgetTotal?: number | null;
  devise?: string;
  pays?: string | null;
  secteur?: string | null;
  bailleurPrincipal?: string | null;
  createdBy?: string | null;
}

export interface UpdateProjectData {
  programmeId?: string;
  nom?: string;
  description?: string | null;
  statut?: ProjectStatus;
  managerId?: string | null;
  dateDebut?: Date | null;
  dateFinPrevue?: Date | null;
  dateFinEffective?: Date | null;
  dateClotureEffective?: Date | null;
  budgetTotal?: number | null;
  devise?: string;
  pays?: string | null;
  secteur?: string | null;
  bailleurPrincipal?: string | null;
  updatedBy?: string | null;
}

export interface FindProjectsParams {
  skip: number;
  take: number;
  search?: string;
  programmeId?: string;
  statut?: ProjectStatus;
  managerId?: string;
  organisationId?: string;
  bailleurPrincipal?: string;
  secteur?: string;
  pays?: string;
  orderBy: Prisma.ProjectOrderByWithRelationInput;
}

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindProjectsParams,
  ): Promise<{ projects: ProjectWithManager[]; total: number }> {
    const where = this.buildWhere(params);

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        include: PROJECT_INCLUDE,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  findById(id: string): Promise<ProjectWithManager | null> {
    return this.prisma.project.findUnique({ where: { id }, include: PROJECT_INCLUDE });
  }

  /** Le code projet est unique globalement. */
  findByCode(code: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { code } });
  }

  create(data: CreateProjectData): Promise<Project> {
    return this.prisma.project.create({
      data: {
        programme_id: data.programmeId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        statut: data.statut,
        manager_id: data.managerId ?? null,
        date_debut: data.dateDebut ?? null,
        date_fin_prevue: data.dateFinPrevue ?? null,
        budget_total: data.budgetTotal ?? null,
        devise: data.devise ?? 'XOF',
        pays: data.pays ?? null,
        secteur: data.secteur ?? null,
        bailleur_principal: data.bailleurPrincipal ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateProjectData): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        programme_id: data.programmeId,
        nom: data.nom,
        description: data.description,
        statut: data.statut,
        manager_id: data.managerId,
        date_debut: data.dateDebut,
        date_fin_prevue: data.dateFinPrevue,
        date_fin_effective: data.dateFinEffective,
        date_cloture_effective: data.dateClotureEffective,
        budget_total: data.budgetTotal,
        devise: data.devise,
        pays: data.pays,
        secteur: data.secteur,
        bailleur_principal: data.bailleurPrincipal,
        updated_by: data.updatedBy,
      },
    });
  }

  /**
   * Soft Delete : `.delete()` est intercepté par le middleware et transformé
   * en `update({ deleted_at })`. Aucune suppression physique.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  /**
   * Calcule toutes les métriques de synthèse d'un projet en une seule passe parallèle.
   * Les count() sont filtrés soft-delete par le middleware Prisma.
   * Les aggregate() nécessitent un filtre explicite deleted_at: null.
   */
  async getProjectAggregations(id: string) {
    const [budgetAgg, tauxAgg, activitesGroup, livrablesGroup, contratsGroup, risquesGroup] =
      await Promise.all([
        this.prisma.budgetLigne.aggregate({
          where: {
            version: { project_id: id, deleted_at: null },
            deleted_at: null,
          },
          _sum: { montant_prevu: true, montant_engage: true, montant_paye: true },
        }),
        this.prisma.ptbaActivite.aggregate({
          where: { project_id: id, deleted_at: null },
          _avg: { taux_realisation: true },
        }),
        this.prisma.ptbaActivite.groupBy({
          by: ['statut'],
          where: { project_id: id, deleted_at: null },
          _count: { _all: true },
        }),
        this.prisma.livrable.groupBy({
          by: ['statut'],
          where: { project_id: id, deleted_at: null },
          _count: { _all: true },
        }),
        this.prisma.contract.groupBy({
          by: ['statut'],
          where: { project_id: id, deleted_at: null },
          _count: { _all: true },
        }),
        this.prisma.risque.groupBy({
          by: ['niveau_criticite'],
          where: { project_id: id, deleted_at: null },
          _count: { _all: true },
        }),
      ]);

    const nombreActivites = activitesGroup.reduce((acc, curr) => acc + curr._count._all, 0);
    const activitesTerminees =
      activitesGroup.find((g) => g.statut === PtbaStatut.TERMINE)?._count._all || 0;
    const activitesEnCours =
      activitesGroup.find((g) => g.statut === PtbaStatut.EN_COURS)?._count._all || 0;
    const activitesEnRetard =
      activitesGroup.find((g) => g.statut === PtbaStatut.EN_RETARD)?._count._all || 0;

    const nombreLivrables = livrablesGroup.reduce((acc, curr) => acc + curr._count._all, 0);
    const livrablesTermines =
      livrablesGroup.find((g) => g.statut === LivrableStatus.VALIDE)?._count._all || 0;
    const livrablesEnCours =
      livrablesGroup.find((g) => g.statut === LivrableStatus.EN_COURS)?._count._all || 0;

    const nombreContrats = contratsGroup.reduce((acc, curr) => acc + curr._count._all, 0);
    const contratsActifs =
      contratsGroup.find((g) => g.statut === ContractStatus.ACTIF)?._count._all || 0;

    const nombreRisques = risquesGroup.reduce((acc, curr) => acc + curr._count._all, 0);
    const risquesCritiques =
      risquesGroup.find((g) => g.niveau_criticite === 'CRITIQUE')?._count._all || 0;

    return {
      budgetAgg,
      tauxAgg,
      nombreActivites,
      activitesTerminees,
      activitesEnCours,
      activitesEnRetard,
      nombreLivrables,
      livrablesTermines,
      livrablesEnCours,
      nombreContrats,
      contratsActifs,
      nombreRisques,
      risquesCritiques,
    };
  }

  /**
   * Calcule par lots (sans N+1) les agrégations nécessaires pour l'affichage de la liste des projets.
   * Utilise exactement 5 requêtes agrégées pour l'ensemble des projets fournis.
   */
  async getBatchAggregations(
    projects: { id: string; budget_total?: any }[],
  ): Promise<Map<string, ProjectAggregationsSummary>> {
    const resultMap = new Map<string, ProjectAggregationsSummary>();
    if (!projects || projects.length === 0) {
      return resultMap;
    }

    const projectIds = projects.map((p) => p.id);

    const [activitesGroups, livrablesGroups, wbsGroups, budgetVersions] = await Promise.all([
      this.prisma.ptbaActivite.groupBy({
        by: ['project_id'],
        where: { project_id: { in: projectIds }, deleted_at: null },
        _count: { _all: true },
        _avg: { taux_realisation: true },
      }),
      this.prisma.livrable.groupBy({
        by: ['project_id'],
        where: { project_id: { in: projectIds }, deleted_at: null },
        _count: { _all: true },
      }),
      this.prisma.wbsNode.groupBy({
        by: ['project_id'],
        where: { project_id: { in: projectIds }, deleted_at: null, parent_id: null },
        _count: { _all: true },
      }),
      this.prisma.budgetVersion.findMany({
        where: { project_id: { in: projectIds }, deleted_at: null },
        select: { id: true, project_id: true },
      }),
    ]);

    const budgetLignesGroups =
      budgetVersions.length > 0
        ? await this.prisma.budgetLigne.groupBy({
            by: ['version_id'],
            where: {
              version_id: { in: budgetVersions.map((v) => v.id) },
              deleted_at: null,
            },
            _sum: { montant_prevu: true, montant_paye: true },
          })
        : [];

    const activitesMap = new Map<string, { count: number; avgTaux: number }>();
    for (const g of activitesGroups) {
      activitesMap.set(g.project_id, {
        count: g._count._all,
        avgTaux: Number(g._avg.taux_realisation ?? 0),
      });
    }

    const livrablesMap = new Map<string, number>();
    for (const g of livrablesGroups) {
      livrablesMap.set(g.project_id, g._count._all);
    }

    const composantesMap = new Map<string, number>();
    for (const g of wbsGroups) {
      composantesMap.set(g.project_id, g._count._all);
    }

    const versionToProjectMap = new Map<string, string>();
    for (const bv of budgetVersions) {
      versionToProjectMap.set(bv.id, bv.project_id);
    }

    const budgetMap = new Map<string, { prevu: number; paye: number }>();
    for (const blg of budgetLignesGroups) {
      const projectId = versionToProjectMap.get(blg.version_id);
      if (projectId) {
        const existing = budgetMap.get(projectId) || { prevu: 0, paye: 0 };
        existing.prevu += Number(blg._sum.montant_prevu ?? 0);
        existing.paye += Number(blg._sum.montant_paye ?? 0);
        budgetMap.set(projectId, existing);
      }
    }

    for (const project of projects) {
      const act = activitesMap.get(project.id) || { count: 0, avgTaux: 0 };
      const livCount = livrablesMap.get(project.id) || 0;
      const compCount = composantesMap.get(project.id) || 0;
      const bud = budgetMap.get(project.id) || { prevu: 0, paye: 0 };

      const budgetTotal = bud.prevu > 0 ? bud.prevu : Number(project.budget_total ?? 0);
      const montantPaye = bud.paye;
      const tauxDecaissement =
        budgetTotal > 0 ? Math.round((montantPaye / budgetTotal) * 10000) / 100 : 0;

      resultMap.set(project.id, {
        progressScore: Math.round(act.avgTaux),
        tauxDecaissement,
        composantes: compCount,
        activites: act.count,
        livrables: livCount,
      });
    }

    return resultMap;
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  findDisbursementsForProject(projectId: string): Promise<Disbursement[]> {
    return this.prisma.disbursement.findMany({
      where: {
        OR: [
          { budget_version: { project_id: projectId, deleted_at: null } },
          { funding_source: { project_id: projectId, deleted_at: null } },
          { contract: { project_id: projectId, deleted_at: null } },
        ],
      },
    });
  }

  findBudgetDistribution(projectId: string) {
    return this.prisma.budgetLigne.groupBy({
      by: ['categorie'],
      where: {
        version: { project_id: projectId, deleted_at: null },
        deleted_at: null,
      },
      _sum: { montant_prevu: true },
      orderBy: { _sum: { montant_prevu: 'desc' } },
    });
  }

  findFundingSources(projectId: string): Promise<FundingSource[]> {
    return this.prisma.fundingSource.findMany({
      where: { project_id: projectId },
      orderBy: { montant: 'desc' },
    });
  }

  findMilestones(projectId: string): Promise<Livrable[]> {
    return this.prisma.livrable.findMany({
      where: { project_id: projectId },
      orderBy: { date_prevue: 'asc' },
    });
  }

  // ─── Portfolio KPIs — calcul direct SQL (Phase 19.5) ─────────────────────────

  /**
   * Calcule les KPIs du portefeuille entier via une seule requête groupBy Prisma.
   * Filtre multi-tenant si organisationId est fourni.
   * N'extrait aucune entité complète : uniquement des compteurs et agrégations.
   */
  async getPortfolioKpis(filters?: {
    programmeId?: string;
    bailleurPrincipal?: string;
    secteur?: string;
    pays?: string;
    organisationId?: string;
  }): Promise<{
    total: number;
    enBonneVoie: number;
    aRisque: number;
    enRetard: number;
    clotured: number;
    budgetTotal: number;
    devise: string;
  }> {
    const baseWhere: Prisma.ProjectWhereInput = {};
    if (filters?.programmeId) baseWhere.programme_id = filters.programmeId;
    if (filters?.bailleurPrincipal) {
      baseWhere.bailleur_principal = { contains: filters.bailleurPrincipal, mode: 'insensitive' };
    }
    if (filters?.secteur) {
      baseWhere.secteur = { contains: filters.secteur, mode: 'insensitive' };
    }
    if (filters?.pays) {
      baseWhere.pays = { contains: filters.pays, mode: 'insensitive' };
    }
    if (filters?.organisationId) {
      baseWhere.programme = {
        unite: { departement: { direction: { organisation_id: filters.organisationId } } },
      };
    }

    const now = new Date();

    // Compteurs parallèles par statut + budget + retard dans une seule transaction
    const [
      enCoursCount,
      suspenduCount,
      clotureCount,
      annuleCount,
      enPreparationCount,
      enRetardCount,
      budgetAgg,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { ...baseWhere, statut: 'EN_COURS' } }),
      this.prisma.project.count({ where: { ...baseWhere, statut: 'SUSPENDU' } }),
      this.prisma.project.count({ where: { ...baseWhere, statut: 'CLOTURE' } }),
      this.prisma.project.count({ where: { ...baseWhere, statut: 'ANNULE' } }),
      this.prisma.project.count({ where: { ...baseWhere, statut: 'EN_PREPARATION' } }),
      this.prisma.project.count({
        where: { ...baseWhere, statut: 'EN_COURS', date_fin_prevue: { lt: now } },
      }),
      this.prisma.project.aggregate({
        where: baseWhere,
        _sum: { budget_total: true },
      }),
    ]);

    const totalCount =
      enCoursCount + suspenduCount + clotureCount + annuleCount + enPreparationCount;

    // Détermination de la devise majoritaire (fallback XOF)
    const deviseMajoritaire = await this.prisma.project.findFirst({
      where: baseWhere,
      select: { devise: true },
      orderBy: { created_at: 'asc' },
    });

    return {
      total: totalCount,
      enBonneVoie: enCoursCount,
      aRisque: suspenduCount,
      enRetard: enRetardCount,
      clotured: clotureCount + annuleCount,
      budgetTotal: Number(budgetAgg._sum.budget_total ?? 0),
      devise: deviseMajoritaire?.devise ?? 'XOF',
    };
  }

  /**
   * Récupère les valeurs distinctes pour les filtres de la liste (Secteurs, Pays, Bailleurs).
   * Utilise findMany avec distinct pour éviter l'extraction d'entités complètes.
   */
  async getReferenceOptions(organisationId?: string): Promise<{
    sectors: string[];
    countries: string[];
    donors: string[];
  }> {
    const baseWhere: Prisma.ProjectWhereInput = {};
    if (organisationId) {
      baseWhere.programme = {
        unite: { departement: { direction: { organisation_id: organisationId } } },
      };
    }

    const [secteurRows, paysRows, bailleurRows] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { ...baseWhere, secteur: { not: null } },
        select: { secteur: true },
        distinct: ['secteur'],
        orderBy: { secteur: 'asc' },
      }),
      this.prisma.project.findMany({
        where: { ...baseWhere, pays: { not: null } },
        select: { pays: true },
        distinct: ['pays'],
        orderBy: { pays: 'asc' },
      }),
      this.prisma.project.findMany({
        where: { ...baseWhere, bailleur_principal: { not: null } },
        select: { bailleur_principal: true },
        distinct: ['bailleur_principal'],
        orderBy: { bailleur_principal: 'asc' },
      }),
    ]);

    return {
      sectors: secteurRows.map((r) => r.secteur!).filter(Boolean),
      countries: paysRows.map((r) => r.pays!).filter(Boolean),
      donors: bailleurRows.map((r) => r.bailleur_principal!).filter(Boolean),
    };
  }

  private buildWhere(params: FindProjectsParams): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {};

    if (params.programmeId) {
      where.programme_id = params.programmeId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.managerId) {
      where.manager_id = params.managerId;
    }
    if (params.organisationId) {
      where.programme = {
        unite: {
          departement: {
            direction: { organisation_id: params.organisationId },
          },
        },
      };
    }

    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.bailleurPrincipal) {
      where.bailleur_principal = { contains: params.bailleurPrincipal, mode: 'insensitive' };
    }
    if (params.secteur) {
      where.secteur = { contains: params.secteur, mode: 'insensitive' };
    }
    if (params.pays) {
      where.pays = { contains: params.pays, mode: 'insensitive' };
    }

    return where;
  }
}
