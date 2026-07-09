import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { JournalOperationRepository } from './journal-operation.repository';
import { CreateJournalOperationDto } from './dto/create-journal-operation.dto';
import { UpdateJournalOperationDto } from './dto/update-journal-operation.dto';
import { JournalOperationQueryDto } from './dto/journal-operation-query.dto';
import { JournalOperationResponseDto } from './dto/journal-operation-response.dto';

const SORTABLE_FIELDS = ['type', 'montant', 'date_operation', 'created_at', 'updated_at'] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class JournalOperationService {
  constructor(
    private readonly journalOperationRepository: JournalOperationRepository,
    private readonly budgetLineService: BudgetLineService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    query: JournalOperationQueryDto,
  ): Promise<PaginatedResult<JournalOperationResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { operations, total } = await this.journalOperationRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      budgetLineId: query.budgetLineId,
      type: query.type,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(operations.map(JournalOperationResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<JournalOperationResponseDto> {
    const operation = await this.journalOperationRepository.findById(id);
    if (!operation) {
      throw new NotFoundException(
        ErrorCode.JOURNAL_OPERATION_NOT_FOUND,
        'Opération de journal introuvable',
      );
    }
    return JournalOperationResponseDto.fromEntity(operation);
  }

  async create(
    dto: CreateJournalOperationDto,
    actor: ActorContext = {},
  ): Promise<JournalOperationResponseDto> {
    await this.budgetLineService.findOne(dto.budgetLineId);

    let operation;
    try {
      operation = await this.journalOperationRepository.create({
        budgetLineId: dto.budgetLineId,
        type: dto.type,
        montant: dto.montant,
        dateOperation: new Date(dto.dateOperation),
        reference: dto.reference ?? null,
        description: dto.description ?? null,
        pieceJointeId: dto.pieceJointeId ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = JournalOperationResponseDto.fromEntity(operation);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'journal_operations',
        enregistrementId: operation.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.JOURNAL_OPERATION_CREATED, {
      journalOperationId: operation.id,
      budgetLineId: operation.budget_ligne_id,
      type: operation.type,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateJournalOperationDto,
    actor: ActorContext = {},
  ): Promise<JournalOperationResponseDto> {
    const existing = await this.journalOperationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.JOURNAL_OPERATION_NOT_FOUND,
        'Opération de journal introuvable',
      );
    }

    const before = JournalOperationResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.journalOperationRepository.update(id, {
        type: dto.type,
        montant: dto.montant,
        dateOperation: dto.dateOperation ? new Date(dto.dateOperation) : undefined,
        reference: dto.reference,
        description: dto.description,
        pieceJointeId: dto.pieceJointeId,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = JournalOperationResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'journal_operations',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.JOURNAL_OPERATION_UPDATED, { journalOperationId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.journalOperationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.JOURNAL_OPERATION_NOT_FOUND,
        'Opération de journal introuvable',
      );
    }

    await this.journalOperationRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'journal_operations',
        enregistrementId: id,
        avant: { ...JournalOperationResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.JOURNAL_OPERATION_DELETED, { journalOperationId: id });
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.CONFLICT,
        "Conflit de données sur l'opération de journal",
      );
    }
    return error;
  }
}
