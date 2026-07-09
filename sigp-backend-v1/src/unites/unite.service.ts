import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { DepartementService } from '@/departements/departement.service';
import { UniteRepository } from './unite.repository';
import { CreateUniteDto } from './dto/create-unite.dto';
import { UpdateUniteDto } from './dto/update-unite.dto';
import { UniteQueryDto } from './dto/unite-query.dto';
import { UniteResponseDto } from './dto/unite-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'nom', 'actif', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class UniteService {
  constructor(
    private readonly uniteRepository: UniteRepository,
    private readonly departementService: DepartementService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: UniteQueryDto): Promise<PaginatedResult<UniteResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { unites, total } = await this.uniteRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      departementId: query.departementId,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(unites.map(UniteResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<UniteResponseDto> {
    const unite = await this.uniteRepository.findById(id);
    if (!unite) {
      throw new NotFoundException(ErrorCode.UNITE_NOT_FOUND, 'Unité introuvable');
    }
    return UniteResponseDto.fromEntity(unite);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateUniteDto, actor: ActorContext = {}): Promise<UniteResponseDto> {
    // Le département parent doit exister (lève DEPARTEMENT_NOT_FOUND / 404 sinon)
    await this.departementService.findOne(dto.departementId);

    const existingByCode = await this.uniteRepository.findByCode(dto.departementId, dto.code);
    if (existingByCode) {
      throw new ConflictException(
        ErrorCode.UNITE_CODE_TAKEN,
        'Ce code est déjà utilisé dans ce département',
      );
    }

    const existingByName = await this.uniteRepository.findByName(dto.departementId, dto.nom);
    if (existingByName) {
      throw new ConflictException(
        ErrorCode.UNITE_NAME_TAKEN,
        'Ce nom est déjà utilisé dans ce département',
      );
    }

    let unite;
    try {
      unite = await this.uniteRepository.create({
        departementId: dto.departementId,
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = UniteResponseDto.fromEntity(unite);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'unites',
        enregistrementId: unite.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.UNITE_CREATED, {
      uniteId: unite.id,
      departementId: unite.departement_id,
      code: unite.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateUniteDto,
    actor: ActorContext = {},
  ): Promise<UniteResponseDto> {
    const existing = await this.uniteRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.UNITE_NOT_FOUND, 'Unité introuvable');
    }

    // Le nom reste unique dans le département : vérifier une éventuelle collision
    if (dto.nom && dto.nom !== existing.nom) {
      const collision = await this.uniteRepository.findByName(existing.departement_id, dto.nom);
      if (collision && collision.id !== id) {
        throw new ConflictException(
          ErrorCode.UNITE_NAME_TAKEN,
          'Ce nom est déjà utilisé dans ce département',
        );
      }
    }

    const before = UniteResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.uniteRepository.update(id, {
        nom: dto.nom,
        description: dto.description,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = UniteResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'unites',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.UNITE_UPDATED, { uniteId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.uniteRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.UNITE_NOT_FOUND, 'Unité introuvable');
    }

    await this.uniteRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'unites',
        enregistrementId: id,
        avant: { ...UniteResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.UNITE_DELETED, { uniteId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta?.target as string[]) : [];
      if (target.some((field) => field.includes('nom'))) {
        return new ConflictException(
          ErrorCode.UNITE_NAME_TAKEN,
          'Ce nom est déjà utilisé dans ce département',
        );
      }
      return new ConflictException(
        ErrorCode.UNITE_CODE_TAKEN,
        'Ce code est déjà utilisé dans ce département',
      );
    }
    return error;
  }
}
