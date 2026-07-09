import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ProgrammeController } from './programme.controller';
import { ProgrammeService } from './programme.service';
import { ProgrammeQueryDto } from './dto/programme-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProgrammeService>;
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

describe('ProgrammeController', () => {
  let controller: ProgrammeController;
  let service: jest.Mocked<ProgrammeService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new ProgrammeController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /programmes delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new ProgrammeQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /programmes/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'p1' } as never);

    await controller.findOne('p1');

    expect(service.findOne).toHaveBeenCalledWith('p1');
  });

  it('POST /programmes delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'p1' } as never);
    const dto = { uniteId: 'uni-1', code: 'PRG-SANTE', nom: 'Programme Santé' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /programmes/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'p1' } as never);

    await controller.update('p1', { nom: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'p1',
      { nom: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /programmes/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('p1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Programme supprimé' });
  });
});
