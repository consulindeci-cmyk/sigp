import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ProjectMemberController } from './project-member.controller';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberQueryDto } from './dto/project-member-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectMemberService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('ProjectMemberController', () => {
  let controller: ProjectMemberController;
  let service: jest.Mocked<ProjectMemberService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new ProjectMemberController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /project-members delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new ProjectMemberQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /project-members/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'm1' } as never);

    await controller.findOne('m1');

    expect(service.findOne).toHaveBeenCalledWith('m1');
  });

  it('POST /project-members delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'm1' } as never);
    const dto = { projectId: 'proj-1', userId: 'usr-1' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /project-members/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'm1' } as never);

    await controller.update('m1', { actif: false }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'm1',
      { actif: false },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /project-members/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('m1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Membre retiré du projet' });
  });
});
