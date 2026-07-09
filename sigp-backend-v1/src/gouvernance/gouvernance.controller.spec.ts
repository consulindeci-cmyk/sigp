import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { GouvernanceController } from './gouvernance.controller';
import { GouvernanceService } from './gouvernance.service';
import { GouvernanceQueryDto } from './dto/gouvernance-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<GouvernanceService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('GouvernanceController', () => {
  let controller: GouvernanceController;
  let service: jest.Mocked<GouvernanceService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new GouvernanceController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /gouvernance delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new GouvernanceQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /gouvernance/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'g1' } as never);

    await controller.findOne('g1');

    expect(service.findOne).toHaveBeenCalledWith('g1');
  });

  it('POST /gouvernance delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'g1' } as never);
    const dto = { projectId: 'proj-1', nom: 'Awa Koné', role: 'Président' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /gouvernance/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'g1' } as never);

    await controller.update('g1', { nom: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'g1',
      { nom: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /gouvernance/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('g1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Entrée de gouvernance supprimée' });
  });
});
