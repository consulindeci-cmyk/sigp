import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';

const PRG_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateProjectDto validation', () => {
  const valid = {
    programmeId: PRG_UUID,
    code: 'PRJ-SANTE-01',
    nom: 'Projet Santé',
    description: 'Accès aux soins',
    statut: ProjectStatus.EN_PREPARATION,
    budgetTotal: 1000000,
    devise: 'XOF',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateProjectDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (programmeId + code + nom)', async () => {
    expect(
      await errorsFor(CreateProjectDto, { programmeId: PRG_UUID, code: 'X', nom: 'X Projet' }),
    ).toEqual([]);
  });

  it('rejects a missing programmeId (obligatoire)', async () => {
    expect(await errorsFor(CreateProjectDto, { code: 'X', nom: 'X' })).toContain('programmeId');
  });

  it('rejects an invalid programmeId (not a UUID)', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, programmeId: 'nope' })).toContain(
      'programmeId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, statut: 'NOPE' })).toContain('statut');
  });

  it('rejects an invalid managerId', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, managerId: 'nope' })).toContain(
      'managerId',
    );
  });

  it('rejects an invalid dateDebut', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, dateDebut: 'not-a-date' })).toContain(
      'dateDebut',
    );
  });

  it('rejects a negative budgetTotal', async () => {
    expect(await errorsFor(CreateProjectDto, { ...valid, budgetTotal: -5 })).toContain(
      'budgetTotal',
    );
  });

  it('normalises the code and devise (trim + uppercase)', () => {
    const instance = plainToInstance(CreateProjectDto, {
      ...valid,
      code: '  prj-sante-01 ',
      devise: ' xof ',
    });
    expect(instance.code).toBe('PRJ-SANTE-01');
    expect(instance.devise).toBe('XOF');
  });

  it('trims the nom and description', () => {
    const instance = plainToInstance(CreateProjectDto, {
      ...valid,
      nom: '  Projet Santé  ',
      description: '  soins  ',
    });
    expect(instance.nom).toBe('Projet Santé');
    expect(instance.description).toBe('soins');
  });
});

describe('UpdateProjectDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateProjectDto, {})).toEqual([]);
  });

  it('allows a valid programmeId (mutable)', async () => {
    expect(await errorsFor(UpdateProjectDto, { programmeId: PRG_UUID })).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdateProjectDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('does not declare code as a mutable property', () => {
    const declared = Object.keys(new UpdateProjectDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
  });
});

describe('ProjectQueryDto validation', () => {
  it('accepts valid programmeId, statut and managerId filters', async () => {
    expect(
      await errorsFor(ProjectQueryDto, {
        programmeId: PRG_UUID,
        statut: ProjectStatus.EN_COURS,
        managerId: PRG_UUID,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(ProjectQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects an invalid programmeId filter', async () => {
    expect(await errorsFor(ProjectQueryDto, { programmeId: 'nope' })).toContain('programmeId');
  });
});
