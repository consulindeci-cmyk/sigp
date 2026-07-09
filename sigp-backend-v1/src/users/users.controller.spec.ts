import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserQueryDto } from './dto/user-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;
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

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new UsersController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /users delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new UserQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /users/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'u1' } as never);

    await controller.findOne('u1');

    expect(service.findOne).toHaveBeenCalledWith('u1');
  });

  it('POST /users delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'u1' } as never);
    const dto = { nom: 'Doe', prenom: 'John', email: 'a@b.c', password: 'Str0ng@Pass' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /users/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'u1' } as never);

    await controller.update('u1', { nom: 'Smith' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'u1',
      { nom: 'Smith' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /users/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('u1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Utilisateur supprimé' });
  });
});
