import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { PpmRepository } from './ppm.repository';
import { CreatePpmMarcheDto } from './dto/create-ppm-marche.dto';
import { UpdatePpmMarcheDto } from './dto/update-ppm-marche.dto';
import { PpmQueryDto } from './dto/ppm-query.dto';
import { PpmResponseDto } from './dto/ppm-response.dto';

const SORTABLE_FIELDS = [
  'code',
  'intitule',
  'type',
  'statut',
  'montant_estime',
  'montant_signe',
  'date_lancement_prevu',
  'date_soumission_prevu',
  'date_attribution',
  'date_signature',
  'date_fin_prevue',
  'date_fin_effective',
  'titulaire',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class PpmService {
  constructor(
    private readonly ppmRepository: PpmRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: PpmQueryDto): Promise<PaginatedResult<PpmResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { marches, total } = await this.ppmRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      type: query.type,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(marches.map(PpmResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<PpmResponseDto> {
    const marche = await this.ppmRepository.findById(id);
    if (!marche) {
      throw new NotFoundException(ErrorCode.PPM_MARCHE_NOT_FOUND, 'Marché PPM introuvable');
    }
    return PpmResponseDto.fromEntity(marche);
  }

  async create(dto: CreatePpmMarcheDto, actor: ActorContext = {}): Promise<PpmResponseDto> {
    await this.projectService.findOne(dto.projectId);

    let marche;
    try {
      marche = await this.ppmRepository.create({
        projectId: dto.projectId,
        code: dto.code,
        intitule: dto.intitule,
        type: dto.type,
        statut: dto.statut,
        montantEstime: dto.montantEstime ?? null,
        montantSigne: dto.montantSigne ?? null,
        dateLancementPrevu: dto.dateLancementPrevu ? new Date(dto.dateLancementPrevu) : null,
        dateSoumissionPrevu: dto.dateSoumissionPrevu ? new Date(dto.dateSoumissionPrevu) : null,
        dateAttribution: dto.dateAttribution ? new Date(dto.dateAttribution) : null,
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
        dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : null,
        dateFinEffective: dto.dateFinEffective ? new Date(dto.dateFinEffective) : null,
        titulaire: dto.titulaire ?? null,
        notes: dto.notes ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PpmResponseDto.fromEntity(marche);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'ppm_marches',
        enregistrementId: marche.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_CREATED, {
      marcheId: marche.id,
      projectId: marche.project_id,
      statut: marche.statut,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdatePpmMarcheDto,
    actor: ActorContext = {},
  ): Promise<PpmResponseDto> {
    const existing = await this.ppmRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PPM_MARCHE_NOT_FOUND, 'Marché PPM introuvable');
    }

    const before = PpmResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.ppmRepository.update(id, {
        code: dto.code,
        intitule: dto.intitule,
        type: dto.type,
        statut: dto.statut,
        montantEstime: dto.montantEstime,
        montantSigne: dto.montantSigne,
        dateLancementPrevu: dto.dateLancementPrevu ? new Date(dto.dateLancementPrevu) : undefined,
        dateSoumissionPrevu: dto.dateSoumissionPrevu
          ? new Date(dto.dateSoumissionPrevu)
          : undefined,
        dateAttribution: dto.dateAttribution ? new Date(dto.dateAttribution) : undefined,
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : undefined,
        dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : undefined,
        dateFinEffective: dto.dateFinEffective ? new Date(dto.dateFinEffective) : undefined,
        titulaire: dto.titulaire,
        notes: dto.notes,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PpmResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'ppm_marches',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_UPDATED, { marcheId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.ppmRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PPM_MARCHE_NOT_FOUND, 'Marché PPM introuvable');
    }

    await this.ppmRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'ppm_marches',
        enregistrementId: id,
        avant: { ...PpmResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PPM_DELETED, { marcheId: id });
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.PPM_MARCHE_CODE_TAKEN,
        'Ce code marché existe déjà dans ce projet',
      );
    }
    return error;
  }
}
