import { ForbiddenException, NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, UserRole } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { ProjectService } from '@/projects/project.service';
import { CommentRepository } from './comment.repository';
import { CommentService, ActorContext } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cmt-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    parent_id: null,
    module: 'Projet',
    element_id: null,
    element_nom: null,
    message: 'Texte du commentaire',
    statut: 'OUVERT',
    priorite: 'NORMALE',
    piece_jointe: null,
    mention: null,
    lu: false,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
    deleted_at: null,
    user: {
      nom: 'Diallo',
      prenom: 'Mamadou',
      role: UserRole.VIEWER,
      avatar_url: null,
    },
    ...overrides,
  };
}

function buildActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    userId: 'user-1',
    userRole: UserRole.VIEWER,
    ip: '127.0.0.1',
    userAgent: 'jest',
    ...overrides,
  };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('CommentService', () => {
  let service: CommentService;
  let repo: jest.Mocked<CommentRepository>;
  let projectService: jest.Mocked<Pick<ProjectService, 'findOne'>>;
  let auditService: jest.Mocked<Pick<AuditService, 'log'>>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  beforeEach(() => {
    repo = {
      findManyPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CommentRepository>;

    projectService = { findOne: jest.fn().mockResolvedValue({ id: 'proj-1' }) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    eventEmitter = { emit: jest.fn() };

    service = new CommentService(
      repo,
      projectService as unknown as ProjectService,
      auditService as unknown as AuditService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('validates the project then queries the repository', async () => {
      repo.findManyPaginated.mockResolvedValue({ comments: [], total: 0 });
      const query = new CommentQueryDto();
      await service.findAll('proj-1', query);
      expect(projectService.findOne).toHaveBeenCalledWith('proj-1');
      expect(repo.findManyPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1' }),
      );
    });

    it('maps comments through CommentResponseDto.fromEntity', async () => {
      const cmt = buildComment();
      repo.findManyPaginated.mockResolvedValue({ comments: [cmt] as never[], total: 1 });
      const result = await service.findAll('proj-1', new CommentQueryDto());
      expect(result.data[0]).toMatchObject({ id: 'cmt-1', auteur: 'Mamadou Diallo' });
    });

    it('defaults sort to created_at desc when sortBy is not in whitelist', async () => {
      repo.findManyPaginated.mockResolvedValue({ comments: [], total: 0 });
      const query = Object.assign(new CommentQueryDto(), { sortBy: 'invalid' });
      await service.findAll('proj-1', query);
      const call = repo.findManyPaginated.mock.calls[0][0];
      expect(call.orderBy).toEqual({ created_at: 'desc' });
    });

    it('throws NotFoundException when project does not exist', async () => {
      projectService.findOne.mockRejectedValue(
        new NotFoundException(ErrorCode.COMMENT_NOT_FOUND, 'Projet introuvable'),
      );
      await expect(service.findAll('bad-proj', new CommentQueryDto())).rejects.toThrow();
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns a mapped DTO for an existing comment', async () => {
      repo.findById.mockResolvedValue(buildComment() as never);
      const result = await service.findOne('cmt-1');
      expect(result.id).toBe('cmt-1');
      expect(result.auteur).toBe('Mamadou Diallo');
    });

    it('throws NotFoundException when comment is absent', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = Object.assign(new CreateCommentDto(), { message: 'Nouveau' });

    it('calls repo.create with projectId + userId from actor', async () => {
      repo.create.mockResolvedValue(buildComment() as never);
      await service.create('proj-1', dto, buildActor());
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', userId: 'user-1', message: 'Nouveau' }),
      );
    });

    it('emits COMMENT_CREATED event', async () => {
      repo.create.mockResolvedValue(buildComment() as never);
      await service.create('proj-1', dto, buildActor());
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.created',
        expect.objectContaining({ commentId: 'cmt-1' }),
      );
    });

    it('emits COMMENT_MENTION event when mention is present', async () => {
      repo.create.mockResolvedValue(buildComment({ mention: '@user2' }) as never);
      await service.create(
        'proj-1',
        { ...dto, mention: '@user2' } as CreateCommentDto,
        buildActor(),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.mention',
        expect.objectContaining({ mention: '@user2' }),
      );
    });

    it('does NOT emit COMMENT_MENTION when mention is null', async () => {
      repo.create.mockResolvedValue(buildComment() as never);
      await service.create('proj-1', dto, buildActor());
      const calls = (eventEmitter.emit as jest.Mock).mock.calls.map((c) => c[0]);
      expect(calls).not.toContain('comment.mention');
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    const dto = Object.assign(new UpdateCommentDto(), { message: 'Modifié' });

    it('allows owner to update their comment', async () => {
      const cmt = buildComment();
      repo.findById.mockResolvedValue(cmt as never);
      repo.update.mockResolvedValue({ ...cmt, message: 'Modifié' } as never);
      const result = await service.update('proj-1', 'cmt-1', dto, buildActor());
      expect(result.message).toBe('Modifié');
    });

    it('allows ADMIN to update a comment they do not own', async () => {
      repo.findById.mockResolvedValue(buildComment({ user_id: 'other-user' }) as never);
      repo.update.mockResolvedValue(buildComment({ message: 'Modifié par admin' }) as never);
      await expect(
        service.update('proj-1', 'cmt-1', dto, buildActor({ userRole: UserRole.ADMIN })),
      ).resolves.toBeTruthy();
    });

    it('throws ForbiddenException when non-owner, non-admin tries to update', async () => {
      repo.findById.mockResolvedValue(buildComment({ user_id: 'other-user' }) as never);
      await expect(service.update('proj-1', 'cmt-1', dto, buildActor())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when comment does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('proj-1', 'cmt-1', dto, buildActor())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when comment belongs to another project', async () => {
      repo.findById.mockResolvedValue(buildComment({ project_id: 'other-proj' }) as never);
      await expect(service.update('proj-1', 'cmt-1', dto, buildActor())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('emits COMMENT_UPDATED event', async () => {
      const cmt = buildComment();
      repo.findById.mockResolvedValue(cmt as never);
      repo.update.mockResolvedValue(cmt as never);
      await service.update('proj-1', 'cmt-1', dto, buildActor());
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.updated',
        expect.objectContaining({ commentId: 'cmt-1' }),
      );
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('allows owner to delete their comment', async () => {
      repo.findById.mockResolvedValue(buildComment() as never);
      repo.softDelete.mockResolvedValue(undefined);
      await expect(service.remove('proj-1', 'cmt-1', buildActor())).resolves.toBeUndefined();
      expect(repo.softDelete).toHaveBeenCalledWith('cmt-1');
    });

    it('allows ADMIN to delete a comment they do not own', async () => {
      repo.findById.mockResolvedValue(buildComment({ user_id: 'other-user' }) as never);
      repo.softDelete.mockResolvedValue(undefined);
      await expect(
        service.remove('proj-1', 'cmt-1', buildActor({ userRole: UserRole.ADMIN })),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when non-owner, non-admin tries to delete', async () => {
      repo.findById.mockResolvedValue(buildComment({ user_id: 'other-user' }) as never);
      await expect(service.remove('proj-1', 'cmt-1', buildActor())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when comment does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('proj-1', 'cmt-1', buildActor())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when comment belongs to another project', async () => {
      repo.findById.mockResolvedValue(buildComment({ project_id: 'other-proj' }) as never);
      await expect(service.remove('proj-1', 'cmt-1', buildActor())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('emits COMMENT_DELETED event', async () => {
      repo.findById.mockResolvedValue(buildComment() as never);
      repo.softDelete.mockResolvedValue(undefined);
      await service.remove('proj-1', 'cmt-1', buildActor());
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.deleted',
        expect.objectContaining({ commentId: 'cmt-1', projectId: 'proj-1' }),
      );
    });

    it('schedules an async audit log', async () => {
      repo.findById.mockResolvedValue(buildComment() as never);
      repo.softDelete.mockResolvedValue(undefined);
      await service.remove('proj-1', 'cmt-1', buildActor());
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'comments' }),
      );
    });
  });
});
