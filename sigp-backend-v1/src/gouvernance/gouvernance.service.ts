import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { UsersService } from '@/users/users.service';
import { GouvernanceRepository } from './gouvernance.repository';
import { CreateGouvernanceDto } from './dto/create-gouvernance.dto';
import { UpdateGouvernanceDto } from './dto/update-gouvernance.dto';
import { GouvernanceQueryDto } from './dto/gouvernance-query.dto';
import { GouvernanceResponseDto } from './dto/gouvernance-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['nom', 'role', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class GouvernanceService {
  constructor(
    private readonly gouvernanceRepository: GouvernanceRepository,
    private readonly projectService: ProjectService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: GouvernanceQueryDto): Promise<PaginatedResult<GouvernanceResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { entries, total } = await this.gouvernanceRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      userId: query.userId,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(entries.map(GouvernanceResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<GouvernanceResponseDto> {
    const entry = await this.gouvernanceRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(
        ErrorCode.GOUVERNANCE_NOT_FOUND,
        'Entrée de gouvernance introuvable',
      );
    }
    return GouvernanceResponseDto.fromEntity(entry);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateGouvernanceDto,
    actor: ActorContext = {},
  ): Promise<GouvernanceResponseDto> {
    // Le projet doit exister (lève PROJECT_NOT_FOUND / 404 sinon)
    await this.projectService.findOne(dto.projectId);

    // L'utilisateur lié, s'il est fourni, doit exister (lève USER_NOT_FOUND / 404 sinon)
    if (dto.userId) {
      await this.usersService.findOne(dto.userId);
    }

    let entry;
    try {
      entry = await this.gouvernanceRepository.create({
        projectId: dto.projectId,
        nom: dto.nom,
        role: dto.role,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        userId: dto.userId,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = GouvernanceResponseDto.fromEntity(entry);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'gouvernance',
        enregistrementId: entry.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.GOUVERNANCE_CREATED, {
      gouvernanceId: entry.id,
      projectId: entry.project_id,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateGouvernanceDto,
    actor: ActorContext = {},
  ): Promise<GouvernanceResponseDto> {
    const existing = await this.gouvernanceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.GOUVERNANCE_NOT_FOUND,
        'Entrée de gouvernance introuvable',
      );
    }

    // L'utilisateur lié, s'il est fourni, doit exister
    if (dto.userId) {
      await this.usersService.findOne(dto.userId);
    }

    const before = GouvernanceResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.gouvernanceRepository.update(id, {
        nom: dto.nom,
        role: dto.role,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        userId: dto.userId,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = GouvernanceResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'gouvernance',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.GOUVERNANCE_UPDATED, { gouvernanceId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.gouvernanceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.GOUVERNANCE_NOT_FOUND,
        'Entrée de gouvernance introuvable',
      );
    }

    await this.gouvernanceRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'gouvernance',
        enregistrementId: id,
        avant: { ...GouvernanceResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.GOUVERNANCE_DELETED, { gouvernanceId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /**
   * Traduit une violation d'unicité Prisma (P2002) en conflit métier.
   * Gouvernance n'a pas de contrainte d'unicité métier ; ce garde-fou couvre
   * uniquement une éventuelle contrainte technique inattendue.
   */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur la gouvernance');
    }
    return error;
  }
}
