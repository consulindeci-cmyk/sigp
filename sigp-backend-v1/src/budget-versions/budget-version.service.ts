import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, BudgetStatus, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { BudgetVersionRepository } from './budget-version.repository';
import { CreateBudgetVersionDto } from './dto/create-budget-version.dto';
import { UpdateBudgetVersionDto } from './dto/update-budget-version.dto';
import { BudgetVersionQueryDto } from './dto/budget-version-query.dto';
import { BudgetVersionResponseDto } from './dto/budget-version-response.dto';

const SORTABLE_FIELDS = [
  'nom',
  'statut',
  'version',
  'montant_total',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

function toDate(value: string | undefined, fallback: null | undefined): Date | null | undefined {
  return value ? new Date(value) : fallback;
}

@Injectable()
export class BudgetVersionService {
  constructor(
    private readonly budgetVersionRepository: BudgetVersionRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: BudgetVersionQueryDto): Promise<PaginatedResult<BudgetVersionResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { versions, total } = await this.budgetVersionRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      statut: query.statut,
      version: query.version,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(versions.map(BudgetVersionResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<BudgetVersionResponseDto> {
    const budgetVersion = await this.budgetVersionRepository.findById(id);
    if (!budgetVersion) {
      throw new NotFoundException(
        ErrorCode.BUDGET_VERSION_NOT_FOUND,
        'Version budgétaire introuvable',
      );
    }
    return BudgetVersionResponseDto.fromEntity(budgetVersion);
  }

  async create(
    dto: CreateBudgetVersionDto,
    actor: ActorContext = {},
  ): Promise<BudgetVersionResponseDto> {
    await this.projectService.findOne(dto.projectId);

    let budgetVersion;
    try {
      budgetVersion = await this.budgetVersionRepository.create({
        projectId: dto.projectId,
        version: dto.version,
        nom: dto.nom,
        statut: dto.statut ?? BudgetStatus.BROUILLON,
        montantTotal: dto.montantTotal,
        approvePar: dto.approvePar ?? null,
        approuveLe: toDate(dto.approuveLe, null) as Date | null,
        notes: dto.notes ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = BudgetVersionResponseDto.fromEntity(budgetVersion);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'budget_versions',
        enregistrementId: budgetVersion.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_VERSION_CREATED, {
      budgetVersionId: budgetVersion.id,
      projectId: budgetVersion.project_id,
      version: budgetVersion.version,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateBudgetVersionDto,
    actor: ActorContext = {},
  ): Promise<BudgetVersionResponseDto> {
    const existing = await this.budgetVersionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.BUDGET_VERSION_NOT_FOUND,
        'Version budgétaire introuvable',
      );
    }

    const before = BudgetVersionResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.budgetVersionRepository.update(id, {
        nom: dto.nom,
        statut: dto.statut,
        montantTotal: dto.montantTotal,
        approvePar: dto.approvePar ?? undefined,
        approuveLe: toDate(dto.approuveLe, undefined) as Date | null | undefined,
        notes: dto.notes ?? undefined,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = BudgetVersionResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'budget_versions',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_VERSION_UPDATED, { budgetVersionId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.budgetVersionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.BUDGET_VERSION_NOT_FOUND,
        'Version budgétaire introuvable',
      );
    }

    await this.budgetVersionRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'budget_versions',
        enregistrementId: id,
        avant: { ...BudgetVersionResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_VERSION_DELETED, { budgetVersionId: id });
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.CONFLICT,
        'Une version avec ce numéro existe déjà pour ce projet',
      );
    }
    return error;
  }
}
