import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, DocumentStatus, Upload } from '@prisma/client';
import * as fs from 'fs';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadsService } from '@/uploads/uploads.service';
import { DocumentGlobalRepository } from './document-global.repository';
import { CreateDocumentGlobalDto } from './dto/create-document-global.dto';
import { UpdateDocumentGlobalDto } from './dto/update-document-global.dto';
import { DocumentGlobalQueryDto } from './dto/document-global-query.dto';
import { DocumentGlobalResponseDto } from './dto/document-global-response.dto';
import { DocumentGlobalVersionResponseDto } from './dto/document-global-version-response.dto';

const SORTABLE_FIELDS = ['titre', 'categorie', 'statut', 'created_at', 'createdAt', 'updated_at', 'updatedAt'] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DocumentGlobalService {
  constructor(
    private readonly documentGlobalRepository: DocumentGlobalRepository,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(query: DocumentGlobalQueryDto): Promise<PaginatedResult<DocumentGlobalResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    let sortField: string =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    if (sortField === 'createdAt') sortField = 'created_at';
    if (sortField === 'updatedAt') sortField = 'updated_at';

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { documents, total } = await this.documentGlobalRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      categorie: query.categorie,
      statut: query.statut,
      createdBy: query.createdBy,
      mimeType: query.mimeType,
      fileType: query.fileType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(documents.map(DocumentGlobalResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<DocumentGlobalResponseDto> {
    const document = await this.documentGlobalRepository.findById(id);
    if (!document) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }
    return DocumentGlobalResponseDto.fromEntity(document);
  }

  async create(dto: CreateDocumentGlobalDto, actor: ActorContext = {}): Promise<DocumentGlobalResponseDto> {
    const document = await this.documentGlobalRepository.create({
      titre: dto.titre,
      description: dto.description ?? null,
      categorie: dto.categorie ?? null,
      statut: dto.statut,
      createdBy: actor.userId ?? null,
    });

    const response = DocumentGlobalResponseDto.fromEntity(document);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'documents_globaux',
        enregistrementId: document.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_GLOBAL_CREATED ?? 'document-global.created', {
      documentId: document.id,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateDocumentGlobalDto,
    actor: ActorContext = {},
  ): Promise<DocumentGlobalResponseDto> {
    const existing = await this.documentGlobalRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }

    const before = DocumentGlobalResponseDto.fromEntity(existing);

    const updated = await this.documentGlobalRepository.update(id, {
      titre: dto.titre,
      description: dto.description,
      categorie: dto.categorie,
      statut: dto.statut,
      updatedBy: actor.userId ?? null,
    });

    const response = DocumentGlobalResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'documents_globaux',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_GLOBAL_UPDATED ?? 'document-global.updated', { documentId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.documentGlobalRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }

    await this.documentGlobalRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'documents_globaux',
        enregistrementId: id,
        avant: { ...DocumentGlobalResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_GLOBAL_DELETED ?? 'document-global.deleted', {
      documentId: id,
    });
  }

  // ── Upload & Versioning Methods ─────────────────────────────────────────────

  async uploadFile(
    id: string,
    file: Express.Multer.File,
    actor: ActorContext = {},
    notes?: string,
    dateVersionStr?: string,
  ): Promise<DocumentGlobalResponseDto> {
    const existing = await this.documentGlobalRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }

    const dateVersion = dateVersionStr ? new Date(dateVersionStr) : new Date();

    await this.prisma.$transaction(async (tx) => {
      const upload = await this.uploadsService.saveFile(file, actor.userId ?? '', tx);
      const latestNum = await this.documentGlobalRepository.findLatestVersionNumber(id, tx);
      await this.documentGlobalRepository.createVersion(
        {
          documentId: id,
          numeroVersion: latestNum + 1,
          uploadId: upload.id,
          dateVersion,
          notes: notes ?? null,
          createdBy: actor.userId ?? null,
        },
        tx,
      );
    });

    const updated = await this.documentGlobalRepository.findById(id);
    if (!updated) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable après upload');
    }

    const response = DocumentGlobalResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'document_global_versions',
        enregistrementId: id,
        apres: { versionNumber: response.latestVersionNumber, uploadId: response.latestUploadId },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.DOCUMENT_GLOBAL_UPDATED ?? 'document-global.updated', { documentId: id });

    return response;
  }

  async getDownloadStream(
    id: string,
    versionNumber?: number,
  ): Promise<{ upload: Upload; stream: fs.ReadStream }> {
    const document = await this.documentGlobalRepository.findById(id);
    if (!document) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }

    let targetUploadId: string | null = null;
    if (versionNumber) {
      const version = await this.documentGlobalRepository.findVersionByNumber(id, versionNumber);
      if (!version) {
        throw new NotFoundException(ErrorCode.DOCUMENT_VERSION_NOT_FOUND, `Version ${versionNumber} introuvable pour ce document global`);
      }
      targetUploadId = version.upload_id;
    } else {
      const versions = document.versions && Array.isArray(document.versions)
        ? [...document.versions].sort((a, b) => b.numero_version - a.numero_version)
        : [];
      const latest = versions[0];
      if (!latest) {
        throw new NotFoundException(ErrorCode.DOCUMENT_VERSION_NOT_FOUND, 'Aucun fichier/version associé à ce document global');
      }
      targetUploadId = latest.upload_id;
    }

    if (!targetUploadId) {
      throw new NotFoundException(ErrorCode.DOCUMENT_VERSION_NOT_FOUND, 'Fichier introuvable pour la version ciblée');
    }

    return this.uploadsService.getFileStream(targetUploadId);
  }

  async getVersions(id: string): Promise<DocumentGlobalVersionResponseDto[]> {
    const document = await this.documentGlobalRepository.findById(id);
    if (!document) {
      throw new NotFoundException(ErrorCode.DOCUMENT_NOT_FOUND, 'Document global introuvable');
    }
    const versions = await this.documentGlobalRepository.findVersionsByDocumentId(id);
    return versions.map((v) => DocumentGlobalVersionResponseDto.fromEntity(v));
  }
}
