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

    return where;
  }
}
