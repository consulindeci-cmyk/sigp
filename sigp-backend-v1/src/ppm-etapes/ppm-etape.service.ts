import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { PpmService } from '@/ppm/ppm.service';
import { PpmEtapeRepository } from './ppm-etape.repository';
import { CreatePpmEtapeDto } from './dto/create-ppm-etape.dto';
import { UpdatePpmEtapeDto } from './dto/update-ppm-etape.dto';
import { PpmEtapeQueryDto } from './dto/ppm-etape-query.dto';
import { PpmEtapeResponseDto } from './dto/ppm-etape-response.dto';

const SORTABLE_FIELDS = [
  'libelle',
  'ordre',
  'date_prevue',
  'date_reelle',
  'complete',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class PpmEtapeService {
  constructor(
    private readonly ppmEtapeRepository: PpmEtapeRepository,
    private readonly ppmService: PpmService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: PpmEtapeQueryDto): Promise<PaginatedResult<PpmEtapeResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'ordre';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { etapes, total } = await this.ppmEtapeRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      marcheId: query.marcheId,
      complete: query.complete,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(etapes.map(PpmEtapeResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<PpmEtapeResponseDto> {
    const etape = await this.ppmEtapeRepository.findById(id);
    if (!etape) {
      throw new NotFoundException(ErrorCode.PPM_ETAPE_NOT_FOUND, 'Étape PPM introuvable');
    }
    return PpmEtapeResponseDto.fromEntity(etape);
  }

  async create(dto: CreatePpmEtapeDto, actor: ActorContext = {}): Promise<PpmEtapeResponseDto> {
    await this.ppmService.findOne(dto.marcheId);

    let etape;
    try {
      etape = await this.ppmEtapeRepository.create({
        marcheId: dto.marcheId,
        libelle: dto.libelle,
        ordre: dto.ordre,
        datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : null,
        dateReelle: dto.dateReelle ? new Date(dto.dateReelle) : null,
        complete: dto.complete ?? false,
        notes: dto.notes ?? null,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PpmEtapeResponseDto.fromEntity(etape);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'ppm_etapes',
        enregistrementId: etape.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_ETAPE_CREATED, {
      etapeId: etape.id,
      marcheId: etape.marche_id,
      ordre: etape.ordre,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdatePpmEtapeDto,
    actor: ActorContext = {},
  ): Promise<PpmEtapeResponseDto> {
    const existing = await this.ppmEtapeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PPM_ETAPE_NOT_FOUND, 'Étape PPM introuvable');
    }

    const before = PpmEtapeResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.ppmEtapeRepository.update(id, {
        libelle: dto.libelle,
        ordre: dto.ordre,
        datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : undefined,
        dateReelle: dto.dateReelle ? new Date(dto.dateReelle) : undefined,
        complete: dto.complete,
        notes: dto.notes,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PpmEtapeResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'ppm_etapes',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_ETAPE_UPDATED, { etapeId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.ppmEtapeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PPM_ETAPE_NOT_FOUND, 'Étape PPM introuvable');
    }

    await this.ppmEtapeRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'ppm_etapes',
        enregistrementId: id,
        avant: { ...PpmEtapeResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_ETAPE_DELETED, { etapeId: id });
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, "Conflit de données sur l'étape PPM");
    }
    return error;
  }
}
