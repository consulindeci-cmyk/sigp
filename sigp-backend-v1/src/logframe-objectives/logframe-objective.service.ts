import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { LogframeObjectiveRepository } from './logframe-objective.repository';
import { CreateLogframeObjectiveDto } from './dto/create-logframe-objective.dto';
import { UpdateLogframeObjectiveDto } from './dto/update-logframe-objective.dto';
import { LogframeObjectiveQueryDto } from './dto/logframe-objective-query.dto';
import { LogframeObjectiveResponseDto } from './dto/logframe-objective-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'niveau', 'ordre', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LogframeObjectiveService {
  constructor(
    private readonly logframeObjectiveRepository: LogframeObjectiveRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(
    query: LogframeObjectiveQueryDto,
  ): Promise<PaginatedResult<LogframeObjectiveResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { objectives, total } = await this.logframeObjectiveRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      niveau: query.niveau,
      parentId: query.parentId,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(objectives.map(LogframeObjectiveResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<LogframeObjectiveResponseDto> {
    const objective = await this.logframeObjectiveRepository.findById(id);
    if (!objective) {
      throw new NotFoundException(ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND, 'Objectif introuvable');
    }
    return LogframeObjectiveResponseDto.fromEntity(objective);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateLogframeObjectiveDto,
    actor: ActorContext = {},
  ): Promise<LogframeObjectiveResponseDto> {
    // Le projet doit exister (lève PROJECT_NOT_FOUND / 404 sinon)
    await this.projectService.findOne(dto.projectId);

    // L'objectif parent, s'il est fourni, doit exister
    if (dto.parentId) {
      const parent = await this.logframeObjectiveRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          ErrorCode.LOGFRAME_OBJECTIVE_PARENT_NOT_FOUND,
          'Objectif parent introuvable',
        );
      }
    }

    let objective;
    try {
      objective = await this.logframeObjectiveRepository.create({
        projectId: dto.projectId,
        niveau: dto.niveau,
        code: dto.code,
        libelle: dto.libelle,
        description: dto.description,
        parentId: dto.parentId,
        ordre: dto.ordre,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = LogframeObjectiveResponseDto.fromEntity(objective);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'logframe_objectives',
        enregistrementId: objective.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_OBJECTIVE_CREATED, {
      objectiveId: objective.id,
      projectId: objective.project_id,
      code: objective.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateLogframeObjectiveDto,
    actor: ActorContext = {},
  ): Promise<LogframeObjectiveResponseDto> {
    const existing = await this.logframeObjectiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND, 'Objectif introuvable');
    }

    // Le parent, s'il est fourni, doit exister et ne peut pas être l'objectif lui-même
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException(
          ErrorCode.CONFLICT,
          'Un objectif ne peut pas être son propre parent',
        );
      }
      const parent = await this.logframeObjectiveRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          ErrorCode.LOGFRAME_OBJECTIVE_PARENT_NOT_FOUND,
          'Objectif parent introuvable',
        );
      }
    }

    const before = LogframeObjectiveResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.logframeObjectiveRepository.update(id, {
        niveau: dto.niveau,
        libelle: dto.libelle,
        description: dto.description,
        parentId: dto.parentId,
        ordre: dto.ordre,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = LogframeObjectiveResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'logframe_objectives',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_OBJECTIVE_UPDATED, { objectiveId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.logframeObjectiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND, 'Objectif introuvable');
    }

    await this.logframeObjectiveRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'logframe_objectives',
        enregistrementId: id,
        avant: { ...LogframeObjectiveResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LOGFRAME_OBJECTIVE_DELETED, { objectiveId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur l’objectif');
    }
    return error;
  }
}
