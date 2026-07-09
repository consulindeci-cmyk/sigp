import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma, ProgrammeStatus } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { UniteService } from '@/unites/unite.service';
import { ProgrammeRepository } from './programme.repository';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { ProgrammeQueryDto } from './dto/programme-query.dto';
import { ProgrammeResponseDto } from './dto/programme-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'nom', 'statut', 'actif', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ProgrammeService {
  constructor(
    private readonly programmeRepository: ProgrammeRepository,
    private readonly uniteService: UniteService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: ProgrammeQueryDto): Promise<PaginatedResult<ProgrammeResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { programmes, total } = await this.programmeRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      uniteId: query.uniteId,
      statut: query.statut,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(programmes.map(ProgrammeResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ProgrammeResponseDto> {
    const programme = await this.programmeRepository.findById(id);
    if (!programme) {
      throw new NotFoundException(ErrorCode.PROGRAMME_NOT_FOUND, 'Programme introuvable');
    }
    return ProgrammeResponseDto.fromEntity(programme);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateProgrammeDto, actor: ActorContext = {}): Promise<ProgrammeResponseDto> {
    // L'unité parente doit exister (lève UNITE_NOT_FOUND / 404 sinon)
    await this.uniteService.findOne(dto.uniteId);

    const existingByCode = await this.programmeRepository.findByCode(dto.uniteId, dto.code);
    if (existingByCode) {
      throw new ConflictException(
        ErrorCode.PROGRAMME_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette unité',
      );
    }

    const existingByName = await this.programmeRepository.findByName(dto.uniteId, dto.nom);
    if (existingByName) {
      throw new ConflictException(
        ErrorCode.PROGRAMME_NAME_TAKEN,
        'Ce nom est déjà utilisé dans cette unité',
      );
    }

    let programme;
    try {
      programme = await this.programmeRepository.create({
        uniteId: dto.uniteId,
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        statut: dto.statut ?? ProgrammeStatus.EN_PREPARATION,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ProgrammeResponseDto.fromEntity(programme);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'programmes',
        enregistrementId: programme.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROGRAMME_CREATED, {
      programmeId: programme.id,
      uniteId: programme.unite_id,
      code: programme.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateProgrammeDto,
    actor: ActorContext = {},
  ): Promise<ProgrammeResponseDto> {
    const existing = await this.programmeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PROGRAMME_NOT_FOUND, 'Programme introuvable');
    }

    // Le nom reste unique dans l'unité : vérifier une éventuelle collision
    if (dto.nom && dto.nom !== existing.nom) {
      const collision = await this.programmeRepository.findByName(existing.unite_id, dto.nom);
      if (collision && collision.id !== id) {
        throw new ConflictException(
          ErrorCode.PROGRAMME_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette unité',
        );
      }
    }

    const before = ProgrammeResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.programmeRepository.update(id, {
        nom: dto.nom,
        description: dto.description,
        statut: dto.statut,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ProgrammeResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'programmes',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROGRAMME_UPDATED, { programmeId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.programmeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PROGRAMME_NOT_FOUND, 'Programme introuvable');
    }

    await this.programmeRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'programmes',
        enregistrementId: id,
        avant: { ...ProgrammeResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROGRAMME_DELETED, { programmeId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta?.target as string[]) : [];
      if (target.some((field) => field.includes('nom'))) {
        return new ConflictException(
          ErrorCode.PROGRAMME_NAME_TAKEN,
          'Ce nom est déjà utilisé dans cette unité',
        );
      }
      return new ConflictException(
        ErrorCode.PROGRAMME_CODE_TAKEN,
        'Ce code est déjà utilisé dans cette unité',
      );
    }
    return error;
  }
}
