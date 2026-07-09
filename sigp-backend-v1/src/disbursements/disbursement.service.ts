import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { FundingSourceService } from '@/funding-sources/funding-source.service';
import { DisbursementRepository } from './disbursement.repository';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';
import { DisbursementResponseDto } from './dto/disbursement-response.dto';

const SORTABLE_FIELDS = [
  'statut',
  'montant',
  'date_prevue',
  'date_reelle',
  'reference',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DisbursementService {
  constructor(
    private readonly disbursementRepository: DisbursementRepository,
    private readonly budgetVersionService: BudgetVersionService,
    private readonly budgetLineService: BudgetLineService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: DisbursementQueryDto): Promise<PaginatedResult<DisbursementResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { disbursements, total } = await this.disbursementRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      budgetVersionId: query.budgetVersionId,
      budgetLineId: query.budgetLineId,
      fundingSourceId: query.fundingSourceId,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(disbursements.map(DisbursementResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<DisbursementResponseDto> {
    const disbursement = await this.disbursementRepository.findById(id);
    if (!disbursement) {
      throw new NotFoundException(ErrorCode.DISBURSEMENT_NOT_FOUND, 'Décaissement introuvable');
    }
    return DisbursementResponseDto.fromEntity(disbursement);
  }

  async create(
    dto: CreateDisbursementDto,
    actor: ActorContext = {},
  ): Promise<DisbursementResponseDto> {
    await this.validateRelations(dto);

    let disbursement;
    try {
      disbursement = await this.disbursementRepository.create({
        budgetVersionId: dto.budgetVersionId ?? null,
        budgetLineId: dto.budgetLineId ?? null,
        contractId: dto.contractId ?? null,
        fundingSourceId: dto.fundingSourceId ?? null,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : null,
        dateReelle: dto.dateReelle ? new Date(dto.dateReelle) : null,
        reference: dto.reference ?? null,
        description: dto.description ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DisbursementResponseDto.fromEntity(disbursement);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'disbursements',
        enregistrementId: disbursement.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DISBURSEMENT_CREATED, {
      disbursementId: disbursement.id,
      budgetVersionId: disbursement.budget_version_id,
      statut: disbursement.statut,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateDisbursementDto,
    actor: ActorContext = {},
  ): Promise<DisbursementResponseDto> {
    const existing = await this.disbursementRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DISBURSEMENT_NOT_FOUND, 'Décaissement introuvable');
    }

    const before = DisbursementResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.disbursementRepository.update(id, {
        contractId: dto.contractId,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : undefined,
        dateReelle: dto.dateReelle ? new Date(dto.dateReelle) : undefined,
        reference: dto.reference,
        description: dto.description,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DisbursementResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'disbursements',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DISBURSEMENT_UPDATED, { disbursementId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.disbursementRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DISBURSEMENT_NOT_FOUND, 'Décaissement introuvable');
    }

    await this.disbursementRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'disbursements',
        enregistrementId: id,
        avant: { ...DisbursementResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DISBURSEMENT_DELETED, { disbursementId: id });
  }

  private async validateRelations(dto: CreateDisbursementDto): Promise<void> {
    let budgetVersionProjectId: string | undefined;

    if (dto.budgetVersionId) {
      const version = await this.budgetVersionService.findOne(dto.budgetVersionId);
      budgetVersionProjectId = version.projectId;
    }

    if (dto.budgetLineId) {
      const line = await this.budgetLineService.findOne(dto.budgetLineId);
      if (dto.budgetVersionId && line.versionId !== dto.budgetVersionId) {
        throw new ConflictException(
          ErrorCode.DISBURSEMENT_COHERENCE_VIOLATION,
          "La ligne budgétaire n'appartient pas à la version budgétaire indiquée",
        );
      }
    }

    if (dto.fundingSourceId) {
      const source = await this.fundingSourceService.findOne(dto.fundingSourceId);
      if (budgetVersionProjectId && source.projectId !== budgetVersionProjectId) {
        throw new ConflictException(
          ErrorCode.DISBURSEMENT_COHERENCE_VIOLATION,
          "La source de financement n'appartient pas au même projet que la version budgétaire",
        );
      }
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur le décaissement');
    }
    return error;
  }
}
