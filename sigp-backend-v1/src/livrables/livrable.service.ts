import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, LivrableStatus } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { LivrableRepository } from './livrable.repository';
import { CreateLivrableDto } from './dto/create-livrable.dto';
import { UpdateLivrableDto } from './dto/update-livrable.dto';
import { LivrableQueryDto } from './dto/livrable-query.dto';
import { LivrableResponseDto } from './dto/livrable-response.dto';

const SORTABLE_FIELDS = [
  'code',
  'nom',
  'statut',
  'date_prevue',
  'date_soumission',
  'date_validation',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LivrableService {
  constructor(
    private readonly livrableRepository: LivrableRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: LivrableQueryDto): Promise<PaginatedResult<LivrableResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { livrables, total } = await this.livrableRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(livrables.map(LivrableResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<LivrableResponseDto> {
    const livrable = await this.livrableRepository.findById(id);
    if (!livrable) {
      throw new NotFoundException(ErrorCode.LIVRABLE_NOT_FOUND, 'Livrable introuvable');
    }
    return LivrableResponseDto.fromEntity(livrable);
  }

  async create(dto: CreateLivrableDto, actor: ActorContext = {}): Promise<LivrableResponseDto> {
    await this.projectService.findOne(dto.projectId);

    const livrable = await this.livrableRepository.create({
      projectId: dto.projectId,
      wbsId: dto.wbsId ?? null,
      code: dto.code ?? null,
      nom: dto.nom,
      description: dto.description ?? null,
      statut: dto.statut,
      datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : null,
      dateSoumission: dto.dateSoumission ? new Date(dto.dateSoumission) : null,
      dateValidation: dto.dateValidation ? new Date(dto.dateValidation) : null,
      responsableId: dto.responsableId ?? null,
      validateurId: dto.validateurId ?? null,
      notes: dto.notes ?? null,
      createdBy: actor.userId ?? null,
    });

    const response = LivrableResponseDto.fromEntity(livrable);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'livrables',
        enregistrementId: livrable.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LIVRABLE_CREATED, {
      livrableId: livrable.id,
      projectId: livrable.project_id,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateLivrableDto,
    actor: ActorContext = {},
  ): Promise<LivrableResponseDto> {
    const existing = await this.livrableRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LIVRABLE_NOT_FOUND, 'Livrable introuvable');
    }

    const before = LivrableResponseDto.fromEntity(existing);

    const updated = await this.livrableRepository.update(id, {
      wbsId: dto.wbsId,
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      statut: dto.statut,
      datePrevue: dto.datePrevue ? new Date(dto.datePrevue) : undefined,
      dateSoumission: dto.dateSoumission ? new Date(dto.dateSoumission) : undefined,
      dateValidation: dto.dateValidation ? new Date(dto.dateValidation) : undefined,
      responsableId: dto.responsableId,
      validateurId: dto.validateurId,
      notes: dto.notes,
      updatedBy: actor.userId ?? null,
    });

    const response = LivrableResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'livrables',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LIVRABLE_UPDATED, { livrableId: id });

    if (dto.statut && dto.statut !== existing.statut) {
      this.eventEmitter.emit(AppEvent.LIVRABLE_STATUS_CHANGED, {
        livrableId: id,
        oldStatut: existing.statut,
        newStatut: dto.statut,
      });

      if (dto.statut === LivrableStatus.SOUMIS) {
        this.eventEmitter.emit(AppEvent.LIVRABLE_SUBMITTED, {
          livrableId: id,
          projectId: existing.project_id,
        });
      }
    }

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.livrableRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.LIVRABLE_NOT_FOUND, 'Livrable introuvable');
    }

    await this.livrableRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'livrables',
        enregistrementId: id,
        avant: { ...LivrableResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.LIVRABLE_DELETED, {
      livrableId: id,
      projectId: existing.project_id,
    });
  }
}
