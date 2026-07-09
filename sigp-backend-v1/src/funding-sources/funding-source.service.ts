import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { FundingSourceRepository } from './funding-source.repository';
import { CreateFundingSourceDto } from './dto/create-funding-source.dto';
import { UpdateFundingSourceDto } from './dto/update-funding-source.dto';
import { FundingSourceQueryDto } from './dto/funding-source-query.dto';
import { FundingSourceResponseDto } from './dto/funding-source-response.dto';

const SORTABLE_FIELDS = [
  'nom',
  'type',
  'montant',
  'pourcentage',
  'devise',
  'date_accord',
  'date_expiry',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class FundingSourceService {
  constructor(
    private readonly fundingSourceRepository: FundingSourceRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: FundingSourceQueryDto): Promise<PaginatedResult<FundingSourceResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { sources, total } = await this.fundingSourceRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      type: query.type,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(sources.map(FundingSourceResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<FundingSourceResponseDto> {
    const source = await this.fundingSourceRepository.findById(id);
    if (!source) {
      throw new NotFoundException(
        ErrorCode.FUNDING_SOURCE_NOT_FOUND,
        'Source de financement introuvable',
      );
    }
    return FundingSourceResponseDto.fromEntity(source);
  }

  async create(
    dto: CreateFundingSourceDto,
    actor: ActorContext = {},
  ): Promise<FundingSourceResponseDto> {
    await this.projectService.findOne(dto.projectId);

    let source;
    try {
      source = await this.fundingSourceRepository.create({
        projectId: dto.projectId,
        nom: dto.nom,
        type: dto.type,
        montant: dto.montant,
        pourcentage: dto.pourcentage ?? null,
        devise: dto.devise,
        dateAccord: dto.dateAccord ? new Date(dto.dateAccord) : null,
        dateExpiry: dto.dateExpiry ? new Date(dto.dateExpiry) : null,
        contact: dto.contact ?? null,
        notes: dto.notes ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = FundingSourceResponseDto.fromEntity(source);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'funding_sources',
        enregistrementId: source.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.FUNDING_SOURCE_CREATED, {
      fundingSourceId: source.id,
      projectId: source.project_id,
      type: source.type,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateFundingSourceDto,
    actor: ActorContext = {},
  ): Promise<FundingSourceResponseDto> {
    const existing = await this.fundingSourceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.FUNDING_SOURCE_NOT_FOUND,
        'Source de financement introuvable',
      );
    }

    const before = FundingSourceResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.fundingSourceRepository.update(id, {
        nom: dto.nom,
        type: dto.type,
        montant: dto.montant,
        pourcentage: dto.pourcentage,
        devise: dto.devise,
        dateAccord: dto.dateAccord ? new Date(dto.dateAccord) : undefined,
        dateExpiry: dto.dateExpiry ? new Date(dto.dateExpiry) : undefined,
        contact: dto.contact,
        notes: dto.notes,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = FundingSourceResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'funding_sources',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.FUNDING_SOURCE_UPDATED, { fundingSourceId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.fundingSourceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.FUNDING_SOURCE_NOT_FOUND,
        'Source de financement introuvable',
      );
    }

    await this.fundingSourceRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'funding_sources',
        enregistrementId: id,
        avant: { ...FundingSourceResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.FUNDING_SOURCE_DELETED, { fundingSourceId: id });
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.CONFLICT,
        'Conflit de données sur la source de financement',
      );
    }
    return error;
  }
}
