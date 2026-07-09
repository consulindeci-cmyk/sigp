import { Request } from 'express';
import { UserRole, WbsNodeType } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { WbsController } from './wbs.controller';
import { WbsService } from './wbs.service';
import { WbsQueryDto } from './dto/wbs-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<WbsService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('WbsController', () => {
  let controller: WbsController;
  let service: jest.Mocked<WbsService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new WbsController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /wbs delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new WbsQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /wbs/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'n1' } as never);

    await controller.findOne('n1');

    expect(service.findOne).toHaveBeenCalledWith('n1');
  });

  it('POST /wbs delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'n1' } as never);
    const dto = { projectId: 'proj-1', code: 'WBS-1', libelle: 'Phase', type: WbsNodeType.PHASE };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /wbs/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'n1' } as never);

    await controller.update('n1', { libelle: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'n1',
      { libelle: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /wbs/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('n1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'n1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Nœud WBS supprimé' });
  });
});
