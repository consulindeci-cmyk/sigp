import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, IndicatorType, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { LogframeIndicatorRepository } from './logframe-indicator.repository';
import { CreateLogframeIndicatorDto } from './dto/create-logframe-indicator.dto';
import { UpdateLogframeIndicatorDto } from './dto/update-logframe-indicator.dto';
import { LogframeIndicatorQueryDto } from './dto/logframe-indicator-query.dto';
import { LogframeIndicatorResponseDto } from './dto/logframe-indicator-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'type', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LogframeIndicatorService {
  constructor(
    private readonly logframeIndicatorRepository: LogframeIndicatorRepository,
    private readonly logframeObjectiveService: LogframeObjectiveService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(
    query: LogframeIndicatorQueryDto,
  ): Promise<PaginatedResult<LogframeIndicatorResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { indicators, total } = await this.logframeIndicatorRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      objectiveId: query.objectiveId,
      type: query.type,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(indicators.map(LogframeIndicatorResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<LogframeIndicatorResponseDto> {
    const indicator = await this.logframeIndicatorRepository.findById(id);
    if (!indicator) {
      throw new NotFoundException(ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND, 'Indicateur introuvable');
    }
    return LogframeIndicatorResponseDto.fromEntity(indicator);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateLogframeIndicatorDto,
    actor: ActorContext = {},
  ): Promise<LogframeIndicatorResponseDto> {
    // L'objectif parent doit exister (lève LOGFRAME_OBJECTIVE_NOT_FOUND / 404 sinon)
    await this.logframeObjectiveService.findOne(dto.objectiveId);

    let indicator;
    try {
      indicator = await this.logframeIndicatorRepository.create({
        objectiveId: dto.objectiveId,
        code: dto.code,
        libelle: dto.libelle,
        type: dto.type ?? IndicatorType.OUTPUT,
        unite: dto.unite,
        valeurBaseline: dto.valeurBaseline,
        valeurCible: dto.valeurCible,
        valeurActuelle: dto.valeurActuelle,
        sourceVerification: dto.sourceVerification,
        periodicite: dto.periodicite,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = LogframeIndicatorResponseDto.fromEntity(indicator);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'logframe_indicators',
        enregistrementId: indicator.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_INDICATOR_CREATED, {
      indicatorId: indicator.id,
      objectiveId: indicator.objective_id,
      code: indicator.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateLogframeIndicatorDto,
    actor: ActorContext = {},
  ): Promise<LogframeIndicatorResponseDto> {
    const existing = await this.logframeIndicatorRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND, 'Indicateur introuvable');
    }

    const before = LogframeIndicatorResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.logframeIndicatorRepository.update(id, {
        libelle: dto.libelle,
        type: dto.type,
        unite: dto.unite,
        valeurBaseline: dto.valeurBaseline,
        valeurCible: dto.valeurCible,
        valeurActuelle: dto.valeurActuelle,
        sourceVerification: dto.sourceVerification,
        periodicite: dto.periodicite,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = LogframeIndicatorResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'logframe_indicators',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_INDICATOR_UPDATED, { indicatorId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.logframeIndicatorRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND, 'Indicateur introuvable');
    }

    await this.logframeIndicatorRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'logframe_indicators',
        enregistrementId: id,
        avant: { ...LogframeIndicatorResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_INDICATOR_DELETED, { indicatorId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur l’indicateur');
    }
    return error;
  }
}
