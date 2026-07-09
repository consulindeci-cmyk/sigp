import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { PpmEtapeController } from './ppm-etape.controller';
import { PpmEtapeService } from './ppm-etape.service';
import { PpmEtapeQueryDto } from './dto/ppm-etape-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<PpmEtapeService>;
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

describe('PpmEtapeController', () => {
  let controller: PpmEtapeController;
  let service: jest.Mocked<PpmEtapeService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new PpmEtapeController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /ppm-etapes delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new PpmEtapeQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /ppm-etapes/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'eta-1' } as never);

    await controller.findOne('eta-1');

    expect(service.findOne).toHaveBeenCalledWith('eta-1');
  });

  it('POST /ppm-etapes delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'eta-1' } as never);
    const dto = { marcheId: 'ppm-1', libelle: 'Étape 1', ordre: 1 };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /ppm-etapes/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'eta-1' } as never);

    await controller.update('eta-1', { complete: true }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'eta-1',
      { complete: true },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /ppm-etapes/:id deletes and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('eta-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'eta-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Étape PPM supprimée' });
  });
});
