import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { DirectionService } from '@/directions/direction.service';
import { DepartementRepository } from './departement.repository';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { DepartementQueryDto } from './dto/departement-query.dto';
import { DepartementResponseDto } from './dto/departement-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'nom', 'actif', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DepartementService {
  constructor(
    private readonly departementRepository: DepartementRepository,
    private readonly directionService: DirectionService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: DepartementQueryDto): Promise<PaginatedResult<DepartementResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { departements, total } = await this.departementRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      directionId: query.directionId,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(departements.map(DepartementResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<DepartementResponseDto> {
    const departement = await this.departementRepository.findById(id);
    if (!departement) {
      throw new NotFoundException(ErrorCode.DEPARTEMENT_NOT_FOUND, 'Département introuvable');
    }
    return DepartementResponseDto.fromEntity(departement);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateDepartementDto,
    actor: ActorContext = {},
  ): Promise<DepartementResponseDto> {
    // La direction parente doit exister (lève DIRECTION_NOT_FOUND / 404 sinon)
    await this.directionService.findOne(dto.directionId);

    const existingByCode = await this.departementRepository.findByCode(dto.directionId, dto.code);
    if (existingByCode) {
      throw new ConflictException(
        ErrorCode.DEPARTEMENT_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette direction',
      );
    }

    const existingByName = await this.departementRepository.findByName(dto.directionId, dto.nom);
    if (existingByName) {
      throw new ConflictException(
        ErrorCode.DEPARTEMENT_NAME_TAKEN,
        'Ce nom est déjà utilisé dans cette direction',
      );
    }

    let departement;
    try {
      departement = await this.departementRepository.create({
        directionId: dto.directionId,
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DepartementResponseDto.fromEntity(departement);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'departements',
        enregistrementId: departement.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DEPARTEMENT_CREATED, {
      departementId: departement.id,
      directionId: departement.direction_id,
      code: departement.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateDepartementDto,
    actor: ActorContext = {},
  ): Promise<DepartementResponseDto> {
    const existing = await this.departementRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DEPARTEMENT_NOT_FOUND, 'Département introuvable');
    }

    // Le nom reste unique dans la direction : vérifier une éventuelle collision
    if (dto.nom && dto.nom !== existing.nom) {
      const collision = await this.departementRepository.findByName(existing.direction_id, dto.nom);
      if (collision && collision.id !== id) {
        throw new ConflictException(
          ErrorCode.DEPARTEMENT_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette direction',
        );
      }
    }

    const before = DepartementResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.departementRepository.update(id, {
        nom: dto.nom,
        description: dto.description,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = DepartementResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'departements',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DEPARTEMENT_UPDATED, { departementId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.departementRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DEPARTEMENT_NOT_FOUND, 'Département introuvable');
    }

    await this.departementRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'departements',
        enregistrementId: id,
        avant: { ...DepartementResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DEPARTEMENT_DELETED, { departementId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta?.target as string[]) : [];
      if (target.some((field) => field.includes('nom'))) {
        return new ConflictException(
          ErrorCode.DEPARTEMENT_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette direction',
        );
      }
      return new ConflictException(
        ErrorCode.DEPARTEMENT_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette direction',
      );
    }
    return error;
  }
}
