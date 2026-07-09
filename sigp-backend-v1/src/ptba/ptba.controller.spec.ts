import { Request } from 'express';
import { PtbaStatut, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { PtbaController } from './ptba.controller';
import { PtbaService } from './ptba.service';
import { PtbaQueryDto } from './dto/ptba-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<PtbaService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('PtbaController', () => {
  let controller: PtbaController;
  let service: jest.Mocked<PtbaService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new PtbaController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /ptba delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new PtbaQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /ptba/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'a1' } as never);

    await controller.findOne('a1');

    expect(service.findOne).toHaveBeenCalledWith('a1');
  });

  it('POST /ptba delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'a1' } as never);
    const dto = {
      projectId: 'proj-1',
      code: 'ACT-1',
      libelle: 'Formation',
      annee: 2026,
      trimestre: 1,
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /ptba/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'a1' } as never);

    await controller.update('a1', { statut: PtbaStatut.EN_COURS }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'a1',
      { statut: PtbaStatut.EN_COURS },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /ptba/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('a1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Activité PTBA supprimée' });
  });
});
