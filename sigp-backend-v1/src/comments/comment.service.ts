import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, UserRole } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ForbiddenException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

const SORTABLE_FIELDS = ['created_at', 'updated_at', 'statut', 'priorite'] as const;

export interface ActorContext {
  userId: string;
  userRole: UserRole;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(
    projectId: string,
    query: CommentQueryDto,
  ): Promise<PaginatedResult<CommentResponseDto>> {
    await this.projectService.findOne(projectId);

    const { skip, take } = paginationToSkipTake(query);
    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { comments, total } = await this.commentRepository.findManyPaginated({
      projectId,
      skip,
      take,
      search: query.search,
      statut: query.statut,
      priorite: query.priorite,
      module: query.module,
      userId: query.userId,
      lu: query.lu,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(comments.map(CommentResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Commentaire introuvable');
    }
    return CommentResponseDto.fromEntity(comment);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    projectId: string,
    dto: CreateCommentDto,
    actor: ActorContext,
  ): Promise<CommentResponseDto> {
    await this.projectService.findOne(projectId);

    const comment = await this.commentRepository.create({
      projectId,
      userId: actor.userId,
      parentId: dto.parent_id,
      module: dto.module,
      elementId: dto.element_id,
      elementNom: dto.element_nom,
      message: dto.message,
      statut: dto.statut,
      priorite: dto.priorite,
      pieceJointe: dto.piece_jointe,
      mention: dto.mention,
      lu: dto.lu,
    });

    const response = CommentResponseDto.fromEntity(comment);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'comments',
        enregistrementId: comment.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.COMMENT_CREATED, {
      commentId: comment.id,
      projectId,
      userId: actor.userId,
    });

    if (comment.mention) {
      this.eventEmitter.emit(AppEvent.COMMENT_MENTION, {
        commentId: comment.id,
        mention: comment.mention,
        projectId,
      });
    }

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    projectId: string,
    id: string,
    dto: UpdateCommentDto,
    actor: ActorContext,
  ): Promise<CommentResponseDto> {
    const existing = await this.commentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Commentaire introuvable');
    }

    if (existing.project_id !== projectId) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Commentaire introuvable');
    }

    if (existing.user_id !== actor.userId && actor.userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        ErrorCode.COMMENT_ACCESS_DENIED,
        'Vous ne pouvez modifier que vos propres commentaires',
      );
    }

    const before = CommentResponseDto.fromEntity(existing);

    const updated = await this.commentRepository.update(id, {
      message: dto.message,
      statut: dto.statut,
      priorite: dto.priorite,
      pieceJointe: dto.piece_jointe,
      mention: dto.mention,
      lu: dto.lu,
    });

    const response = CommentResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'comments',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.COMMENT_UPDATED, { commentId: id, projectId });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(projectId: string, id: string, actor: ActorContext): Promise<void> {
    const existing = await this.commentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Commentaire introuvable');
    }

    if (existing.project_id !== projectId) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Commentaire introuvable');
    }

    if (existing.user_id !== actor.userId && actor.userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        ErrorCode.COMMENT_ACCESS_DENIED,
        'Vous ne pouvez supprimer que vos propres commentaires',
      );
    }

    await this.commentRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'comments',
        enregistrementId: id,
        avant: { ...CommentResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.COMMENT_DELETED, { commentId: id, projectId });
  }
}
