import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoleMembreProjet } from '@prisma/client';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { ProjectMemberQueryDto } from './dto/project-member-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const USER_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateProjectMemberDto validation', () => {
  const valid = { projectId: PROJ_UUID, userId: USER_UUID, role: RoleMembreProjet.CHEF_PROJET };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateProjectMemberDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId + userId, role optional)', async () => {
    expect(
      await errorsFor(CreateProjectMemberDto, { projectId: PROJ_UUID, userId: USER_UUID }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(await errorsFor(CreateProjectMemberDto, { userId: USER_UUID })).toContain('projectId');
  });

  it('rejects a missing userId', async () => {
    expect(await errorsFor(CreateProjectMemberDto, { projectId: PROJ_UUID })).toContain('userId');
  });

  it('rejects an invalid projectId (not a UUID)', async () => {
    expect(await errorsFor(CreateProjectMemberDto, { ...valid, projectId: 'nope' })).toContain(
      'projectId',
    );
  });

  it('rejects an invalid role', async () => {
    expect(await errorsFor(CreateProjectMemberDto, { ...valid, role: 'BOSS' })).toContain('role');
  });
});

describe('UpdateProjectMemberDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateProjectMemberDto, {})).toEqual([]);
  });

  it('accepts a valid role and actif', async () => {
    expect(
      await errorsFor(UpdateProjectMemberDto, { role: RoleMembreProjet.OBSERVATEUR, actif: true }),
    ).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateProjectMemberDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare projectId or userId as mutable properties', () => {
    const declared = Object.keys(new UpdateProjectMemberDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
    expect(declared).not.toContain('userId');
  });
});

describe('ProjectMemberQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(ProjectMemberQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(ProjectMemberQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts valid projectId, userId and role filters', async () => {
    expect(
      await errorsFor(ProjectMemberQueryDto, {
        projectId: PROJ_UUID,
        userId: USER_UUID,
        role: RoleMembreProjet.MEMBRE,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid role filter', async () => {
    expect(await errorsFor(ProjectMemberQueryDto, { role: 'BOSS' })).toContain('role');
  });
});
