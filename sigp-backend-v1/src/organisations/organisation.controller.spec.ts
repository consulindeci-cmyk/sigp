import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { OrganisationQueryDto } from './dto/organisation-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<OrganisationService>;
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

describe('OrganisationController', () => {
  let controller: OrganisationController;
  let service: jest.Mocked<OrganisationService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new OrganisationController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /organisations delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new OrganisationQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /organisations/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'o1' } as never);

    await controller.findOne('o1');

    expect(service.findOne).toHaveBeenCalledWith('o1');
  });

  it('POST /organisations delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'o1' } as never);
    const dto = { code: 'MIN-SANTE', nom: 'Ministère de la Santé' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /organisations/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'o1' } as never);

    await controller.update('o1', { nom: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'o1',
      { nom: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /organisations/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('o1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Organisation supprimée' });
  });
});
