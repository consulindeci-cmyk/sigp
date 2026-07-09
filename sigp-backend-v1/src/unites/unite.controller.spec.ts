import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { UniteController } from './unite.controller';
import { UniteService } from './unite.service';
import { UniteQueryDto } from './dto/unite-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<UniteService>;
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

describe('UniteController', () => {
  let controller: UniteController;
  let service: jest.Mocked<UniteService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new UniteController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /unites delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new UniteQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /unites/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'u1' } as never);

    await controller.findOne('u1');

    expect(service.findOne).toHaveBeenCalledWith('u1');
  });

  it('POST /unites delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'u1' } as never);
    const dto = { departementId: 'dep-1', code: 'UNI-RESEAU', nom: 'Unité Réseau' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /unites/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'u1' } as never);

    await controller.update('u1', { nom: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'u1',
      { nom: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /unites/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('u1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Unité supprimée' });
  });
});
