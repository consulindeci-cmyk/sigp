import { Request } from 'express';
import { BudgetStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { BudgetVersionController } from './budget-version.controller';
import { BudgetVersionService } from './budget-version.service';
import { BudgetVersionQueryDto } from './dto/budget-version-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<BudgetVersionService>;
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

describe('BudgetVersionController', () => {
  let controller: BudgetVersionController;
  let service: jest.Mocked<BudgetVersionService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new BudgetVersionController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /budget-versions delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new BudgetVersionQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /budget-versions/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'bv-1' } as never);

    await controller.findOne('bv-1');

    expect(service.findOne).toHaveBeenCalledWith('bv-1');
  });

  it('POST /budget-versions delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'bv-1' } as never);
    const dto = { projectId: 'proj-1', nom: 'Budget initial' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /budget-versions/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'bv-1' } as never);

    await controller.update('bv-1', { statut: BudgetStatus.SOUMIS }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'bv-1',
      { statut: BudgetStatus.SOUMIS },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /budget-versions/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('bv-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'bv-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Version budgétaire supprimée' });
  });
});
