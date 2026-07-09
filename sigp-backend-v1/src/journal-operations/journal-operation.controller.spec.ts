import { Request } from 'express';
import { JournalType, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { JournalOperationController } from './journal-operation.controller';
import { JournalOperationService } from './journal-operation.service';
import { JournalOperationQueryDto } from './dto/journal-operation-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<JournalOperationService>;
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

describe('JournalOperationController', () => {
  let controller: JournalOperationController;
  let service: jest.Mocked<JournalOperationService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new JournalOperationController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /journal-operations delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new JournalOperationQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /journal-operations/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'op-1' } as never);

    await controller.findOne('op-1');

    expect(service.findOne).toHaveBeenCalledWith('op-1');
  });

  it('POST /journal-operations delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'op-1' } as never);
    const dto = {
      budgetLineId: 'bl-1',
      type: JournalType.DEPENSE,
      montant: 5000000,
      dateOperation: '2026-03-15',
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /journal-operations/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'op-1' } as never);

    await controller.update('op-1', { type: JournalType.RECETTE }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'op-1',
      { type: JournalType.RECETTE },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /journal-operations/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('op-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'op-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Opération de journal supprimée' });
  });
});
