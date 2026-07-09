import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { BudgetLineController } from './budget-line.controller';
import { BudgetLineService } from './budget-line.service';
import { BudgetLineQueryDto } from './dto/budget-line-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<BudgetLineService>;
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

describe('BudgetLineController', () => {
  let controller: BudgetLineController;
  let service: jest.Mocked<BudgetLineService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new BudgetLineController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /budget-lines delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new BudgetLineQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /budget-lines/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'bl-1' } as never);

    await controller.findOne('bl-1');

    expect(service.findOne).toHaveBeenCalledWith('bl-1');
  });

  it('POST /budget-lines delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'bl-1' } as never);
    const dto = { versionId: 'bv-1', codeLigne: 'PERS-001', libelle: 'Personnel permanent' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /budget-lines/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'bl-1' } as never);

    await controller.update('bl-1', { montantEngage: 12000000 }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'bl-1',
      { montantEngage: 12000000 },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /budget-lines/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('bl-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'bl-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Ligne budgétaire supprimée' });
  });
});
