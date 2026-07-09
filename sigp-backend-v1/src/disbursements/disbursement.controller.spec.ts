import { Request } from 'express';
import { DisbursementStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { DisbursementController } from './disbursement.controller';
import { DisbursementService } from './disbursement.service';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<DisbursementService>;
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

describe('DisbursementController', () => {
  let controller: DisbursementController;
  let service: jest.Mocked<DisbursementService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new DisbursementController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /disbursements delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new DisbursementQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /disbursements/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'dis-1' } as never);

    await controller.findOne('dis-1');

    expect(service.findOne).toHaveBeenCalledWith('dis-1');
  });

  it('POST /disbursements delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'dis-1' } as never);
    const dto = { montant: 5000000 };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /disbursements/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'dis-1' } as never);

    await controller.update('dis-1', { statut: DisbursementStatus.APPROUVE }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'dis-1',
      { statut: DisbursementStatus.APPROUVE },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /disbursements/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('dis-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'dis-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Décaissement supprimé' });
  });
});
