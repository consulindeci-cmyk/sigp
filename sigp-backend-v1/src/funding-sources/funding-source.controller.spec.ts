import { Request } from 'express';
import { FundingSourceType, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { FundingSourceController } from './funding-source.controller';
import { FundingSourceService } from './funding-source.service';
import { FundingSourceQueryDto } from './dto/funding-source-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<FundingSourceService>;
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

describe('FundingSourceController', () => {
  let controller: FundingSourceController;
  let service: jest.Mocked<FundingSourceService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new FundingSourceController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /funding-sources delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new FundingSourceQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /funding-sources/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'src-1' } as never);

    await controller.findOne('src-1');

    expect(service.findOne).toHaveBeenCalledWith('src-1');
  });

  it('POST /funding-sources delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'src-1' } as never);
    const dto = {
      projectId: 'proj-1',
      nom: 'Banque Mondiale',
      montant: 5000000000,
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /funding-sources/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'src-1' } as never);

    await controller.update('src-1', { type: FundingSourceType.AUTRE }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'src-1',
      { type: FundingSourceType.AUTRE },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /funding-sources/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('src-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'src-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Source de financement supprimée' });
  });
});
