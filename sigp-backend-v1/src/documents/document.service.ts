import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, DocumentStatus } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { DocumentRepository } from './document.repository';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { DocumentResponseDto } from './dto/document-response.dto';

const SORTABLE_FIELDS = ['titre', 'statut', 'created_at', 'updated_at'] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: DocumentQueryDto): Promise<PaginatedResult<DocumentResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { documents, total } = await this.documentRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      livrableId: query.livrableId,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(documents.map(DocumentResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document introuvable');
    }
    return DocumentResponseDto.fromEntity(document);
  }

  async create(dto: CreateDocumentDto, actor: ActorContext = {}): Promise<DocumentResponseDto> {
    await this.projectService.findOne(dto.projectId);

    const document = await this.documentRepository.create({
      projectId: dto.projectId,
      livrableId: dto.livrableId ?? null,
      titre: dto.titre,
      description: dto.description ?? null,
      statut: dto.statut,
      createdBy: actor.userId ?? null,
    });

    const response = DocumentResponseDto.fromEntity(document);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'documents_projet',
        enregistrementId: document.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_CREATED, {
      documentId: document.id,
      projectId: document.project_id,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    actor: ActorContext = {},
  ): Promise<DocumentResponseDto> {
    const existing = await this.documentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document introuvable');
    }

    const before = DocumentResponseDto.fromEntity(existing);

    const updated = await this.documentRepository.update(id, {
      livrableId: dto.livrableId,
      titre: dto.titre,
      description: dto.description,
      statut: dto.statut,
      updatedBy: actor.userId ?? null,
    });

    const response = DocumentResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'documents_projet',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_UPDATED, { documentId: id });

    if (dto.statut && dto.statut !== existing.statut) {
      if (dto.statut === DocumentStatus.VALIDE) {
        this.eventEmitter.emit(AppEvent.DOCUMENT_VALIDATED, {
          documentId: id,
          projectId: existing.project_id,
        });
      } else if (dto.statut === DocumentStatus.REJETE) {
        this.eventEmitter.emit(AppEvent.DOCUMENT_REJECTED, {
          documentId: id,
          projectId: existing.project_id,
        });
      }
    }

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.documentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document introuvable');
    }

    await this.documentRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'documents_projet',
        enregistrementId: id,
        avant: { ...DocumentResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_DELETED, {
      documentId: id,
      projectId: existing.project_id,
    });
  }
}
