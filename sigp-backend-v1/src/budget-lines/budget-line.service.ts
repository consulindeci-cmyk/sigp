import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineRepository } from './budget-line.repository';
import { CreateBudgetLineDto } from './dto/create-budget-line.dto';
import { UpdateBudgetLineDto } from './dto/update-budget-line.dto';
import { BudgetLineQueryDto } from './dto/budget-line-query.dto';
import { BudgetLineResponseDto } from './dto/budget-line-response.dto';

const SORTABLE_FIELDS = [
  'code_ligne',
  'libelle',
  'ordre',
  'montant_prevu',
  'montant_engage',
  'montant_paye',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class BudgetLineService {
  constructor(
    private readonly budgetLineRepository: BudgetLineRepository,
    private readonly budgetVersionService: BudgetVersionService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: BudgetLineQueryDto): Promise<PaginatedResult<BudgetLineResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { lignes, total } = await this.budgetLineRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      versionId: query.versionId,
      parentId: query.parentId,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(lignes.map(BudgetLineResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<BudgetLineResponseDto> {
    const ligne = await this.budgetLineRepository.findById(id);
    if (!ligne) {
      throw new NotFoundException(ErrorCode.BUDGET_LIGNE_NOT_FOUND, 'Ligne budgétaire introuvable');
    }
    return BudgetLineResponseDto.fromEntity(ligne);
  }

  async create(dto: CreateBudgetLineDto, actor: ActorContext = {}): Promise<BudgetLineResponseDto> {
    await this.budgetVersionService.findOne(dto.versionId);

    if (dto.parentId) {
      await this.validateParent(dto.parentId, dto.versionId);
    }

    let ligne;
    try {
      ligne = await this.budgetLineRepository.create({
        versionId: dto.versionId,
        parentId: dto.parentId ?? null,
        codeLigne: dto.codeLigne,
        libelle: dto.libelle,
        categorie: dto.categorie ?? null,
        montantPrevu: dto.montantPrevu,
        montantEngage: dto.montantEngage,
        montantPaye: dto.montantPaye,
        ordre: dto.ordre,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = BudgetLineResponseDto.fromEntity(ligne);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'budget_lignes',
        enregistrementId: ligne.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_LINE_CREATED, {
      budgetLineId: ligne.id,
      versionId: ligne.version_id,
      codeLigne: ligne.code_ligne,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateBudgetLineDto,
    actor: ActorContext = {},
  ): Promise<BudgetLineResponseDto> {
    const existing = await this.budgetLineRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.BUDGET_LIGNE_NOT_FOUND, 'Ligne budgétaire introuvable');
    }

    if (dto.parentId) {
      await this.validateParent(dto.parentId, existing.version_id);
    }

    const before = BudgetLineResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.budgetLineRepository.update(id, {
        parentId: dto.parentId,
        libelle: dto.libelle,
        categorie: dto.categorie,
        montantPrevu: dto.montantPrevu,
        montantEngage: dto.montantEngage,
        montantPaye: dto.montantPaye,
        ordre: dto.ordre,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = BudgetLineResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'budget_lignes',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_LINE_UPDATED, { budgetLineId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.budgetLineRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.BUDGET_LIGNE_NOT_FOUND, 'Ligne budgétaire introuvable');
    }

    await this.budgetLineRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'budget_lignes',
        enregistrementId: id,
        avant: { ...BudgetLineResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.BUDGET_LINE_DELETED, { budgetLineId: id });
  }

  /**
   * Vérifie que la ligne parente existe et appartient à la même version budgétaire.
   * Protège contre les hiérarchies incohérentes inter-versions.
   */
  private async validateParent(parentId: string, versionId: string): Promise<void> {
    const parent = await this.budgetLineRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(
        ErrorCode.BUDGET_LIGNE_NOT_FOUND,
        'La ligne parente est introuvable',
      );
    }
    if (parent.version_id !== versionId) {
      throw new ConflictException(
        ErrorCode.BUDGET_COHERENCE_VIOLATION,
        'La ligne parente appartient à une autre version budgétaire',
      );
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.CONFLICT,
        'Une ligne avec ce code existe déjà dans cette version',
      );
    }
    return error;
  }
}
