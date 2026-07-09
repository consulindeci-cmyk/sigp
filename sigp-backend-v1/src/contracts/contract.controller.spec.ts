import { Request } from 'express';
import { ContractStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractQueryDto } from './dto/contract-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ContractService>;
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

describe('ContractController', () => {
  let controller: ContractController;
  let service: jest.Mocked<ContractService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new ContractController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /contracts delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new ContractQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /contracts/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'ctr-1' } as never);

    await controller.findOne('ctr-1');

    expect(service.findOne).toHaveBeenCalledWith('ctr-1');
  });

  it('POST /contracts delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'ctr-1' } as never);
    const dto = {
      projectId: 'proj-1',
      numero: 'CTR-001',
      intitule: 'Contrat test',
      titulaire: 'Entreprise Alpha',
      montant: 10000000,
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /contracts/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'ctr-1' } as never);

    await controller.update('ctr-1', { statut: ContractStatus.CLOTURE }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'ctr-1',
      { statut: ContractStatus.CLOTURE },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /contracts/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('ctr-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'ctr-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Contrat supprimé' });
  });
});
