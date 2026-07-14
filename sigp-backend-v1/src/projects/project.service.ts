import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, DisbursementStatus, Prisma, ProjectStatus, UserRole } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, ForbiddenException, NotFoundException } from '@/common/exceptions/business.exception';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProgrammeService } from '@/programmes/programme.service';
import { UsersService } from '@/users/users.service';
import { RisqueRepository } from '@/risques/risque.repository';
import { PtbaRepository } from '@/ptba/ptba.repository';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectSummaryResponseDto } from './dto/project-summary-response.dto';
import { RiskTopResponseDto } from './dto/risk-top-response.dto';
import { CriticalActivityResponseDto } from './dto/critical-activity-response.dto';
import { DisbursementMonthlyResponseDto } from './dto/disbursement-monthly-response.dto';
import { BudgetDistributionResponseDto } from './dto/budget-distribution-response.dto';
import { FundingSourceResponseDto } from './dto/funding-source-response.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = [
  'code',
  'nom',
  'statut',
  'date_debut',
  'date_fin_prevue',
  'created_at',
  'updated_at',
  'bailleur_principal',
  'pays',
  'secteur',
  'budget_total',
] as const;

const SORT_COLUMN_MAPPING: Record<string, string> = {
  code: 'code',
  nom: 'nom',
  name: 'nom',
  statut: 'statut',
  status: 'statut',
  date_debut: 'date_debut',
  dateDebut: 'date_debut',
  startDate: 'date_debut',
  date_fin_prevue: 'date_fin_prevue',
  dateFinPrevue: 'date_fin_prevue',
  endDate: 'date_fin_prevue',
  created_at: 'created_at',
  createdAt: 'created_at',
  updated_at: 'updated_at',
  updatedAt: 'updated_at',
  bailleur_principal: 'bailleur_principal',
  bailleurPrincipal: 'bailleur_principal',
  donor: 'bailleur_principal',
  pays: 'pays',
  country: 'pays',
  secteur: 'secteur',
  sector: 'secteur',
  budget_total: 'budget_total',
  budgetTotal: 'budget_total',
  budgetDisplay: 'budget_total',
};

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  userRole?: UserRole;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly programmeService: ProgrammeService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly risqueRepository: RisqueRepository,
    private readonly ptbaRepository: PtbaRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(
    query: ProjectQueryDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResult<ProjectResponseDto>> {
    if (user && user.role !== 'ADMIN') {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { organisation_id: true },
      });
      query.organisationId = dbUser?.organisation_id || undefined;
    }
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && SORT_COLUMN_MAPPING[query.sortBy]
        ? SORT_COLUMN_MAPPING[query.sortBy]
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { projects, total } = await this.projectRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      programmeId: query.programmeId,
      statut: query.statut,
      managerId: query.managerId,
      organisationId: query.organisationId,
      bailleurPrincipal: query.bailleurPrincipal,
      secteur: query.secteur,
      pays: query.pays,
      orderBy: { [sortField]: sortOrder },
    });

    const aggMap = await this.projectRepository.getBatchAggregations(projects);

    return paginate(
      projects.map((p) => ProjectResponseDto.fromEntity(p, aggMap.get(p.id))),
      total,
      query,
    );
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }
    const aggMap = await this.projectRepository.getBatchAggregations([project]);
    return ProjectResponseDto.fromEntity(project, aggMap.get(project.id));
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto, actor: ActorContext = {}): Promise<ProjectResponseDto> {
    // Le programme parent doit exister et appartenir à la même organisation que l'acteur (sauf ADMIN)
    if (dto.programmeId) {
      await this.validateProgrammeOrganisation(dto.programmeId, actor);
    }

    // Le manager, s'il est fourni, doit exister (lève USER_NOT_FOUND / 404 sinon)
    if (dto.managerId) {
      await this.usersService.findOne(dto.managerId);
    }

    const existingByCode = await this.projectRepository.findByCode(dto.code);
    if (existingByCode) {
      throw new ConflictException(ErrorCode.PROJECT_CODE_TAKEN, 'Ce code projet est déjà utilisé');
    }

    let project;
    try {
      project = await this.projectRepository.create({
        programmeId: dto.programmeId,
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        statut: dto.statut ?? ProjectStatus.EN_PREPARATION,
        managerId: dto.managerId,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : null,
        budgetTotal: dto.budgetTotal,
        devise: dto.devise,
        pays: dto.pays,
        secteur: dto.secteur,
        bailleurPrincipal: dto.bailleurPrincipal,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ProjectResponseDto.fromEntity(project);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'projects',
        enregistrementId: project.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_CREATED, {
      projectId: project.id,
      programmeId: project.programme_id,
      code: project.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateProjectDto,
    actor: ActorContext = {},
  ): Promise<ProjectResponseDto> {
    const existing = await this.projectRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }

    // programmeId est modifiable : vérifier l'existence et l'accès multi-tenant au nouveau programme
    if (dto.programmeId && dto.programmeId !== existing.programme_id) {
      await this.validateProgrammeOrganisation(dto.programmeId, actor);
    }

    // manager, s'il est fourni, doit exister
    if (dto.managerId) {
      await this.usersService.findOne(dto.managerId);
    }

    const before = ProjectResponseDto.fromEntity(existing);

    const updated = await this.projectRepository.update(id, {
      programmeId: dto.programmeId,
      nom: dto.nom,
      description: dto.description,
      statut: dto.statut,
      managerId: dto.managerId,
      dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
      dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : undefined,
      dateFinEffective: dto.dateFinEffective ? new Date(dto.dateFinEffective) : undefined,
      dateClotureEffective: dto.dateClotureEffective
        ? new Date(dto.dateClotureEffective)
        : undefined,
      budgetTotal: dto.budgetTotal,
      devise: dto.devise,
      pays: dto.pays,
      secteur: dto.secteur,
      bailleurPrincipal: dto.bailleurPrincipal,
      updatedBy: actor.userId,
    });

    const aggMap = await this.projectRepository.getBatchAggregations([updated]);
    const response = ProjectResponseDto.fromEntity(updated, aggMap.get(updated.id));

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'projects',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_UPDATED, { projectId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.projectRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }

    await this.projectRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'projects',
        enregistrementId: id,
        avant: { ...ProjectResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_DELETED, { projectId: id });
  }

  // ─── Synthèse projet ─────────────────────────────────────────────────────────

  async getSummary(id: string): Promise<ProjectSummaryResponseDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }

    const agg = await this.projectRepository.getProjectAggregations(id);

    const budgetTotal = Number(agg.budgetAgg._sum.montant_prevu ?? 0);
    const montantEngage = Number(agg.budgetAgg._sum.montant_engage ?? 0);
    const montantPaye = Number(agg.budgetAgg._sum.montant_paye ?? 0);
    const soldeDisponible = budgetTotal - montantPaye;
    const tauxDecaissement =
      budgetTotal > 0 ? Math.round((montantPaye / budgetTotal) * 10000) / 100 : 0;

    const tauxAvancementGlobal = Math.round(Number(agg.tauxAgg._avg.taux_realisation ?? 0));

    const fields = [
      project.nom,
      project.description,
      project.budget_total,
      project.manager_id,
      project.programme_id,
      project.secteur,
      project.pays,
      project.devise,
      project.date_debut,
      project.bailleur_principal,
    ];
    const filledFields = fields.filter((f) => f !== null && f !== undefined && f !== '');
    const profileScore = Math.round((filledFields.length / fields.length) * 100);

    let displayStatus = 'En préparation';
    if (project.statut === 'EN_COURS') {
      if (agg.risquesCritiques > 0) {
        displayStatus = 'En difficulté';
      } else if (agg.activitesEnRetard > 0) {
        displayStatus = 'En retard';
      } else {
        displayStatus = 'En bonne voie';
      }
    } else if (project.statut === 'CLOTURE') {
      displayStatus = 'Clôturé';
    } else if (project.statut === 'SUSPENDU') {
      displayStatus = 'Suspendu';
    } else if (project.statut === 'ANNULE') {
      displayStatus = 'Annulé';
    }

    return {
      budgetTotal,
      montantEngage,
      montantPaye,
      soldeDisponible,
      tauxDecaissement,
      nombreActivites: agg.nombreActivites,
      activitesTerminees: agg.activitesTerminees,
      activitesEnCours: agg.activitesEnCours,
      activitesEnRetard: agg.activitesEnRetard,
      nombreLivrables: agg.nombreLivrables,
      livrablesTermines: agg.livrablesTermines,
      livrablesEnCours: agg.livrablesEnCours,
      nombreContrats: agg.nombreContrats,
      contratsActifs: agg.contratsActifs,
      nombreRisques: agg.nombreRisques,
      risquesCritiques: agg.risquesCritiques,
      tauxAvancementGlobal,
      progressScore: tauxAvancementGlobal,
      profileScore,
      displayStatus,
    };
  }

  // ─── Top risques ─────────────────────────────────────────────────────────────

  private static readonly PROB_ORDER: Record<string, number> = {
    QUASI_CERTAIN: 3,
    PROBABLE: 2,
    POSSIBLE: 1,
    FAIBLE: 0,
  };

  async getTopRisks(id: string): Promise<RiskTopResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }
    const risks = await this.risqueRepository.findActiveByProject(id);
    const sorted = [...risks]
      .sort((a, b) => {
        const aCrit = a.niveau_criticite === 'CRITIQUE' ? 1 : 0;
        const bCrit = b.niveau_criticite === 'CRITIQUE' ? 1 : 0;
        if (bCrit !== aCrit) return bCrit - aCrit;
        return (
          (ProjectService.PROB_ORDER[b.probabilite] ?? 0) -
          (ProjectService.PROB_ORDER[a.probabilite] ?? 0)
        );
      })
      .slice(0, 5);
    return sorted.map(RiskTopResponseDto.fromEntity);
  }

  // ─── Activités critiques ──────────────────────────────────────────────────────

  async getCriticalActivities(id: string): Promise<CriticalActivityResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }
    const now = new Date();
    const activities = await this.ptbaRepository.findCriticalByProject(id);
    return activities.map((act) => CriticalActivityResponseDto.fromEntity(act, now));
  }

  // ─── Analytique projet ────────────────────────────────────────────────────────

  private static readonly MONTHS_FR = [
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
  ] as const;

  private static monthLabel(date: Date): string {
    return `${ProjectService.MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
  }

  private static monthSortKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  async getDisbursementsMonthly(id: string): Promise<DisbursementMonthlyResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');

    const disbursements = await this.projectRepository.findDisbursementsForProject(id);

    const buckets = new Map<
      string,
      { montantPrevu: number; montantPaye: number; sortKey: string }
    >();

    const getOrCreate = (label: string, sortKey: string) => {
      if (!buckets.has(label)) buckets.set(label, { montantPrevu: 0, montantPaye: 0, sortKey });
      return buckets.get(label)!;
    };

    for (const d of disbursements) {
      if (d.date_prevue) {
        const label = ProjectService.monthLabel(d.date_prevue);
        const bucket = getOrCreate(label, ProjectService.monthSortKey(d.date_prevue));
        bucket.montantPrevu += Number(d.montant);
      }
      if (d.statut === DisbursementStatus.DECAISSE && d.date_reelle) {
        const label = ProjectService.monthLabel(d.date_reelle);
        const bucket = getOrCreate(label, ProjectService.monthSortKey(d.date_reelle));
        bucket.montantPaye += Number(d.montant);
      }
    }

    return [...buckets.entries()]
      .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
      .map(([month, bucket]) => ({
        month,
        montantPrevu: Math.round(bucket.montantPrevu),
        montantPaye: Math.round(bucket.montantPaye),
      }));
  }

  async getBudgetDistribution(id: string): Promise<BudgetDistributionResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');

    const rows = await this.projectRepository.findBudgetDistribution(id);

    return rows
      .filter((r) => r._sum.montant_prevu !== null)
      .map((r) => ({
        rubrique: r.categorie ?? 'Non catégorisé',
        montant: Math.round(Number(r._sum.montant_prevu)),
      }));
  }

  async getFundingSources(id: string): Promise<FundingSourceResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');

    const sources = await this.projectRepository.findFundingSources(id);

    const total = sources.reduce((sum, s) => sum + Number(s.montant), 0);

    return sources.map((s) => {
      const montant = Math.round(Number(s.montant));
      const pourcentage =
        s.pourcentage !== null
          ? Math.round(Number(s.pourcentage) * 100) / 100
          : total > 0
            ? Math.round((montant / total) * 10000) / 100
            : 0;
      return { source: s.nom, montant, pourcentage };
    });
  }

  async getMilestones(id: string): Promise<MilestoneResponseDto[]> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');

    const livrables = await this.projectRepository.findMilestones(id);

    return livrables.map((l) => ({
      id: l.id,
      titre: l.nom,
      datePrevue: l.date_prevue?.toISOString() ?? null,
      statut: l.statut,
    }));
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Vérifie que le programme cible existe et appartient à la même organisation que l'acteur (multi-tenant). */
  private async validateProgrammeOrganisation(
    programmeId: string,
    actor: ActorContext,
  ): Promise<void> {
    const programme = await this.prisma.programme.findUnique({
      where: { id: programmeId },
      include: {
        unite: {
          include: {
            departement: {
              include: {
                direction: true,
              },
            },
          },
        },
      },
    });

    if (!programme) {
      throw new NotFoundException(ErrorCode.PROGRAMME_NOT_FOUND, 'Programme introuvable');
    }

    if (actor.userRole === UserRole.ADMIN || (actor.userRole as string) === 'ADMIN') {
      return;
    }

    if (!actor.userId) {
      return;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { organisation_id: true },
    });

    if (!dbUser || !dbUser.organisation_id) {
      throw new ForbiddenException(
        ErrorCode.PROJECT_ACCESS_DENIED,
        "Accès refusé : vous n'êtes rattaché à aucune organisation.",
      );
    }

    const programmeOrganisationId = programme.unite?.departement?.direction?.organisation_id;

    if (!programmeOrganisationId) {
      throw new ForbiddenException(
        ErrorCode.PROJECT_ACCESS_DENIED,
        "Accès refusé : le programme cible n'est rattaché à aucune organisation.",
      );
    }

    if (programmeOrganisationId !== dbUser.organisation_id) {
      throw new ForbiddenException(
        ErrorCode.PROJECT_ACCESS_DENIED,
        "Accès refusé : le programme cible appartient à une autre organisation.",
      );
    }
  }

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.PROJECT_CODE_TAKEN, 'Ce code projet est déjà utilisé');
    }
    return error;
  }
}
