import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, OrganisationType, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { OrganisationRepository } from './organisation.repository';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';
import { OrganisationResponseDto } from './dto/organisation-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = ['code', 'nom', 'type', 'actif', 'created_at', 'updated_at'] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class OrganisationService {
  constructor(
    private readonly organisationRepository: OrganisationRepository,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: OrganisationQueryDto): Promise<PaginatedResult<OrganisationResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { organisations, total } = await this.organisationRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      type: query.type,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(organisations.map(OrganisationResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<OrganisationResponseDto> {
    const org = await this.organisationRepository.findById(id);
    if (!org) {
      throw new NotFoundException(ErrorCode.ORGANISATION_NOT_FOUND, 'Organisation introuvable');
    }
    return OrganisationResponseDto.fromEntity(org);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateOrganisationDto,
    actor: ActorContext = {},
  ): Promise<OrganisationResponseDto> {
    const existingByCode = await this.organisationRepository.findByCode(dto.code);
    if (existingByCode) {
      throw new ConflictException(ErrorCode.ORGANISATION_CODE_TAKEN, 'Ce code est déjà utilisé');
    }

    const existingByName = await this.organisationRepository.findByName(dto.nom);
    if (existingByName) {
      throw new ConflictException(ErrorCode.ORGANISATION_NAME_TAKEN, 'Ce nom est déjà utilisé');
    }

    let org;
    try {
      org = await this.organisationRepository.create({
        code: dto.code,
        nom: dto.nom,
        type: dto.type ?? OrganisationType.AUTRE,
        description: dto.description,
        email: dto.email,
        telephone: dto.telephone,
        siteWeb: dto.siteWeb,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = OrganisationResponseDto.fromEntity(org);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'organisations',
        enregistrementId: org.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.ORGANISATION_CREATED, {
      organisationId: org.id,
      code: org.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateOrganisationDto,
    actor: ActorContext = {},
  ): Promise<OrganisationResponseDto> {
    const existing = await this.organisationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.ORGANISATION_NOT_FOUND, 'Organisation introuvable');
    }

    // Le nom reste unique : on vérifie s'il change et entre en collision
    if (dto.nom && dto.nom !== existing.nom) {
      const collision = await this.organisationRepository.findByName(dto.nom);
      if (collision && collision.id !== id) {
        throw new ConflictException(ErrorCode.ORGANISATION_NAME_TAKEN, 'Ce nom est déjà utilisé');
      }
    }

    const before = OrganisationResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.organisationRepository.update(id, {
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        email: dto.email,
        telephone: dto.telephone,
        siteWeb: dto.siteWeb,
        actif: dto.actif,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = OrganisationResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'organisations',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.ORGANISATION_UPDATED, { organisationId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.organisationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.ORGANISATION_NOT_FOUND, 'Organisation introuvable');
    }

    await this.organisationRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'organisations',
        enregistrementId: id,
        avant: { ...OrganisationResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.ORGANISATION_DELETED, { organisationId: id });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta?.target as string[]) : [];
      if (target.some((field) => field.includes('nom'))) {
        return new ConflictException(ErrorCode.ORGANISATION_NAME_TAKEN, 'Ce nom est déjà utilisé');
      }
      return new ConflictException(ErrorCode.ORGANISATION_CODE_TAKEN, 'Ce code est déjà utilisé');
    }
    return error;
  }
}
