import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentQueryDto } from './dto/document-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<DocumentService>;
}

const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@sigp.local',
  role: UserRole.ADMIN,
};

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: jest.Mocked<DocumentService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new DocumentController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /documents delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new DocumentQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /documents/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'doc-1' } as never);

    await controller.findOne('doc-1');

    expect(service.findOne).toHaveBeenCalledWith('doc-1');
  });

  it('POST /documents delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'doc-1' } as never);
    const dto = { projectId: 'proj-1', titre: 'Rapport' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /documents/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'doc-1' } as never);

    await controller.update('doc-1', { titre: 'Nouveau titre' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'doc-1',
      { titre: 'Nouveau titre' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /documents/:id soft-deletes and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('doc-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'doc-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Document supprimé' });
  });
});
