import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { WbsRepository } from './wbs.repository';
import { CreateWbsNodeDto } from './dto/create-wbs-node.dto';
import { UpdateWbsNodeDto } from './dto/update-wbs-node.dto';
import { WbsQueryDto } from './dto/wbs-query.dto';
import { WbsResponseDto } from './dto/wbs-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'type', 'ordre', 'niveau', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class WbsService {
  constructor(
    private readonly wbsRepository: WbsRepository,
    private readonly projectService: ProjectService,
    private readonly logframeObjectiveService: LogframeObjectiveService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: WbsQueryDto): Promise<PaginatedResult<WbsResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { nodes, total } = await this.wbsRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      parentId: query.parentId,
      objectiveId: query.objectiveId,
      type: query.type,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(nodes.map(WbsResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<WbsResponseDto> {
    const node = await this.wbsRepository.findById(id);
    if (!node) {
      throw new NotFoundException(ErrorCode.WBS_NODE_NOT_FOUND, 'Nœud WBS introuvable');
    }
    return WbsResponseDto.fromEntity(node);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateWbsNodeDto, actor: ActorContext = {}): Promise<WbsResponseDto> {
    // Le projet doit exister (lève PROJECT_NOT_FOUND / 404 sinon)
    await this.projectService.findOne(dto.projectId);

    // L'objectif du cadre logique, s'il est fourni, doit exister
    if (dto.objectiveId) {
      await this.logframeObjectiveService.findOne(dto.objectiveId);
    }

    // Le nœud parent, s'il est fourni, doit exister → détermine le niveau
    let niveau = 1;
    if (dto.parentId) {
      const parent = await this.findOne(dto.parentId); // 404 WBS_NODE_NOT_FOUND sinon
      if (parent.projectId !== dto.projectId) {
        throw new ConflictException(
          ErrorCode.WBS_INVALID_HIERARCHY,
          'Le nœud parent appartient à un autre projet',
        );
      }
      niveau = parent.niveau + 1;
    }

    let node;
    try {
      node = await this.wbsRepository.create({
        projectId: dto.projectId,
        parentId: dto.parentId,
        objectiveId: dto.objectiveId,
        code: dto.code,
        libelle: dto.libelle,
        type: dto.type,
        niveau,
        ordre: dto.ordre,
        responsableId: dto.responsableId,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = WbsResponseDto.fromEntity(node);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'wbs_nodes',
        enregistrementId: node.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.WBS_NODE_CREATED, {
      wbsNodeId: node.id,
      projectId: node.project_id,
      code: node.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateWbsNodeDto,
    actor: ActorContext = {},
  ): Promise<WbsResponseDto> {
    const existing = await this.wbsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.WBS_NODE_NOT_FOUND, 'Nœud WBS introuvable');
    }

    if (dto.objectiveId) {
      await this.logframeObjectiveService.findOne(dto.objectiveId);
    }

    // Re-parentage : contrôles d'intégrité de la hiérarchie
    let niveau: number | undefined;
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException(
          ErrorCode.WBS_INVALID_HIERARCHY,
          'Un nœud ne peut pas être son propre parent',
        );
      }
      const parent = await this.findOne(dto.parentId); // 404 sinon
      if (parent.parentId === id) {
        throw new ConflictException(
          ErrorCode.WBS_INVALID_HIERARCHY,
          'Cycle direct détecté entre les deux nœuds',
        );
      }
      if (parent.projectId !== existing.project_id) {
        throw new ConflictException(
          ErrorCode.WBS_INVALID_HIERARCHY,
          'Le nœud parent appartient à un autre projet',
        );
      }
      niveau = parent.niveau + 1;
    }

    const before = WbsResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.wbsRepository.update(id, {
        parentId: dto.parentId,
        objectiveId: dto.objectiveId,
        libelle: dto.libelle,
        type: dto.type,
        niveau,
        ordre: dto.ordre,
        responsableId: dto.responsableId,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = WbsResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'wbs_nodes',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.WBS_NODE_UPDATED, { wbsNodeId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.wbsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.WBS_NODE_NOT_FOUND, 'Nœud WBS introuvable');
    }

    await this.wbsRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'wbs_nodes',
        enregistrementId: id,
        avant: { ...WbsResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.WBS_NODE_DELETED, { wbsNodeId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur le nœud WBS');
    }
    return error;
  }
}
