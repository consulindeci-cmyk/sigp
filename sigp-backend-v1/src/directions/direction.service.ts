import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { OrganisationService } from '@/organisations/organisation.service';
import { DirectionRepository } from './direction.repository';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';
import { DirectionQueryDto } from './dto/direction-query.dto';
import { DirectionResponseDto } from './dto/direction-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'nom', 'actif', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DirectionService {
  constructor(
    private readonly directionRepository: DirectionRepository,
    private readonly organisationService: OrganisationService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: DirectionQueryDto): Promise<PaginatedResult<DirectionResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { directions, total } = await this.directionRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      organisationId: query.organisationId,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(directions.map(DirectionResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<DirectionResponseDto> {
    const direction = await this.directionRepository.findById(id);
    if (!direction) {
      throw new NotFoundException(ErrorCode.DIRECTION_NOT_FOUND, 'Direction introuvable');
    }
    return DirectionResponseDto.fromEntity(direction);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateDirectionDto, actor: ActorContext = {}): Promise<DirectionResponseDto> {
    // L'organisation parente doit exister (lève ORGANISATION_NOT_FOUND / 404 sinon)
    await this.organisationService.findOne(dto.organisationId);

    const existingByCode = await this.directionRepository.findByCode(dto.organisationId, dto.code);
    if (existingByCode) {
      throw new ConflictException(
        ErrorCode.DIRECTION_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette organisation',
      );
    }

    const existingByName = await this.directionRepository.findByName(dto.organisationId, dto.nom);
    if (existingByName) {
      throw new ConflictException(
        ErrorCode.DIRECTION_NAME_TAKEN,
        'Ce nom est déjà utilisé dans cette organisation',
      );
    }

    let direction;
    try {
      direction = await this.directionRepository.create({
        organisationId: dto.organisationId,
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DirectionResponseDto.fromEntity(direction);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'directions',
        enregistrementId: direction.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DIRECTION_CREATED, {
      directionId: direction.id,
      organisationId: direction.organisation_id,
      code: direction.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateDirectionDto,
    actor: ActorContext = {},
  ): Promise<DirectionResponseDto> {
    const existing = await this.directionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DIRECTION_NOT_FOUND, 'Direction introuvable');
    }

    // Le nom reste unique dans l'organisation : vérifier une éventuelle collision
    if (dto.nom && dto.nom !== existing.nom) {
      const collision = await this.directionRepository.findByName(
        existing.organisation_id,
        dto.nom,
      );
      if (collision && collision.id !== id) {
        throw new ConflictException(
          ErrorCode.DIRECTION_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette organisation',
        );
      }
    }

    const before = DirectionResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.directionRepository.update(id, {
        nom: dto.nom,
        description: dto.description,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DirectionResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'directions',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DIRECTION_UPDATED, { directionId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.directionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DIRECTION_NOT_FOUND, 'Direction introuvable');
    }

    await this.directionRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'directions',
        enregistrementId: id,
        avant: { ...DirectionResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DIRECTION_DELETED, { directionId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta?.target as string[]) : [];
      if (target.some((field) => field.includes('nom'))) {
        return new ConflictException(
          ErrorCode.DIRECTION_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette organisation',
        );
      }
      return new ConflictException(
        ErrorCode.DIRECTION_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette organisation',
      );
    }
    return error;
  }
}
