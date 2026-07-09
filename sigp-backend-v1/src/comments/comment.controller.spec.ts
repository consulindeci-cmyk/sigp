import { UserRole } from '@prisma/client';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildUser(role: UserRole = UserRole.VIEWER) {
  return { id: 'user-1', role } as never;
}

function buildReq() {
  return {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  } as never;
}

function buildCommentDto(): CommentResponseDto {
  return {
    id: 'cmt-1',
    projet_id: 'proj-1',
    auteur: 'Mamadou Diallo',
    role: 'MEMBER',
    message: 'Hello',
    date_creation: '2024-01-15',
    date_modification: '2024-01-15',
    statut: 'OUVERT',
    priorite: 'NORMALE',
    module: null,
    element_id: null,
    element_nom: null,
    parent_id: null,
    piece_jointe: null,
    mention: null,
    lu: false,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  } as CommentResponseDto;
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('CommentController', () => {
  let controller: CommentController;
  let service: jest.Mocked<CommentService>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<CommentService>;

    controller = new CommentController(service);
  });

  afterEach(() => jest.clearAllMocks());

  const PROJECT_ID = 'proj-1';

  // ─── GET / (findAll) ───────────────────────────────────────────────────────

  describe('GET /projects/:projectId/comments', () => {
    it('delegates to service.findAll and returns the flat data array', async () => {
      const dto = buildCommentDto();
      service.findAll.mockResolvedValue({ data: [dto], meta: {} } as never);

      const query = new CommentQueryDto();
      const result = await controller.findAll(PROJECT_ID, query);

      expect(service.findAll).toHaveBeenCalledWith(PROJECT_ID, query);
      expect(result).toEqual([dto]);
    });

    it('passes all query filters through to the service', async () => {
      service.findAll.mockResolvedValue({ data: [], meta: {} } as never);
      const query = Object.assign(new CommentQueryDto(), { statut: 'RESOLU', priorite: 'HAUTE' });
      await controller.findAll(PROJECT_ID, query);
      expect(service.findAll).toHaveBeenCalledWith(PROJECT_ID, query);
    });
  });

  // ─── GET /:id (findOne) ────────────────────────────────────────────────────

  describe('GET /projects/:projectId/comments/:id', () => {
    it('delegates to service.findOne and returns the DTO', async () => {
      const dto = buildCommentDto();
      service.findOne.mockResolvedValue(dto);

      const result = await controller.findOne(PROJECT_ID, 'cmt-1');

      expect(service.findOne).toHaveBeenCalledWith('cmt-1');
      expect(result).toBe(dto);
    });
  });

  // ─── POST / (create) ──────────────────────────────────────────────────────

  describe('POST /projects/:projectId/comments', () => {
    it('delegates to service.create with projectId and actor context', async () => {
      const dto = buildCommentDto();
      service.create.mockResolvedValue(dto);

      const createDto = Object.assign(new CreateCommentDto(), { message: 'Nouveau' });
      const result = await controller.create(PROJECT_ID, createDto, buildUser(), buildReq());

      expect(service.create).toHaveBeenCalledWith(
        PROJECT_ID,
        createDto,
        expect.objectContaining({ userId: 'user-1', userRole: UserRole.VIEWER }),
      );
      expect(result).toBe(dto);
    });
  });

  // ─── PATCH /:id (update) ──────────────────────────────────────────────────

  describe('PATCH /projects/:projectId/comments/:id', () => {
    it('delegates to service.update with projectId, id, dto and actor', async () => {
      const dto = buildCommentDto();
      service.update.mockResolvedValue(dto);

      const updateDto = Object.assign(new UpdateCommentDto(), { statut: 'RESOLU' });
      const result = await controller.update(
        PROJECT_ID,
        'cmt-1',
        updateDto,
        buildUser(),
        buildReq(),
      );

      expect(service.update).toHaveBeenCalledWith(
        PROJECT_ID,
        'cmt-1',
        updateDto,
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(result).toBe(dto);
    });
  });

  // ─── DELETE /:id (remove) ─────────────────────────────────────────────────

  describe('DELETE /projects/:projectId/comments/:id', () => {
    it('delegates to service.remove and returns confirmation message', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(PROJECT_ID, 'cmt-1', buildUser(), buildReq());

      expect(service.remove).toHaveBeenCalledWith(
        PROJECT_ID,
        'cmt-1',
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(result).toEqual({ message: 'Commentaire supprimé' });
    });
  });

  // ─── Actor context building ────────────────────────────────────────────────

  describe('actor() extraction', () => {
    it('maps user.id to actor.userId and user.role to actor.userRole', async () => {
      service.create.mockResolvedValue(buildCommentDto());
      const adminUser = buildUser(UserRole.ADMIN);
      await controller.create(
        PROJECT_ID,
        Object.assign(new CreateCommentDto(), { message: 'X' }),
        adminUser,
        buildReq(),
      );
      const actorArg = service.create.mock.calls[0][2];
      expect(actorArg.userId).toBe('user-1');
      expect(actorArg.userRole).toBe(UserRole.ADMIN);
    });

    it('includes ip from request', async () => {
      service.create.mockResolvedValue(buildCommentDto());
      await controller.create(
        PROJECT_ID,
        Object.assign(new CreateCommentDto(), { message: 'X' }),
        buildUser(),
        buildReq(),
      );
      const actorArg = service.create.mock.calls[0][2];
      expect(actorArg.ip).toBe('127.0.0.1');
    });
  });
});
