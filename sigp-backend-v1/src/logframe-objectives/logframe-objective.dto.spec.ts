import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LogframeLevel } from '@prisma/client';
import { CreateLogframeObjectiveDto } from './dto/create-logframe-objective.dto';
import { UpdateLogframeObjectiveDto } from './dto/update-logframe-objective.dto';
import { LogframeObjectiveQueryDto } from './dto/logframe-objective-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const PARENT_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateLogframeObjectiveDto validation', () => {
  const valid = {
    projectId: PROJ_UUID,
    niveau: LogframeLevel.OBJECTIF_GLOBAL,
    code: 'OG-1',
    libelle: 'Améliorer l’accès aux soins',
    ordre: 0,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, valid)).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(
      await errorsFor(CreateLogframeObjectiveDto, { ...valid, projectId: undefined }),
    ).toContain('projectId');
  });

  it('rejects an invalid niveau', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, { ...valid, niveau: 'NOPE' })).toContain(
      'niveau',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing libelle', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, { ...valid, libelle: '' })).toContain(
      'libelle',
    );
  });

  it('rejects an invalid parentId', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, { ...valid, parentId: 'nope' })).toContain(
      'parentId',
    );
  });

  it('rejects a negative ordre', async () => {
    expect(await errorsFor(CreateLogframeObjectiveDto, { ...valid, ordre: -1 })).toContain('ordre');
  });

  it('normalises the code (trim + uppercase) and trims the libelle', () => {
    const instance = plainToInstance(CreateLogframeObjectiveDto, {
      ...valid,
      code: '  og-1 ',
      libelle: '  Objectif  ',
    });
    expect(instance.code).toBe('OG-1');
    expect(instance.libelle).toBe('Objectif');
  });
});

describe('UpdateLogframeObjectiveDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateLogframeObjectiveDto, {})).toEqual([]);
  });

  it('accepts a boolean actif and a valid parentId', async () => {
    expect(
      await errorsFor(UpdateLogframeObjectiveDto, { actif: false, parentId: PARENT_UUID }),
    ).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateLogframeObjectiveDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or projectId as mutable properties', () => {
    const declared = Object.keys(new UpdateLogframeObjectiveDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('projectId');
  });
});

describe('LogframeObjectiveQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(LogframeObjectiveQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(LogframeObjectiveQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts valid projectId, niveau and parentId filters', async () => {
    expect(
      await errorsFor(LogframeObjectiveQueryDto, {
        projectId: PROJ_UUID,
        niveau: LogframeLevel.RESULTAT,
        parentId: PARENT_UUID,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid niveau filter', async () => {
    expect(await errorsFor(LogframeObjectiveQueryDto, { niveau: 'NOPE' })).toContain('niveau');
  });
});
