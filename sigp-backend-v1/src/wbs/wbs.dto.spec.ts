import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { WbsNodeType } from '@prisma/client';
import { CreateWbsNodeDto } from './dto/create-wbs-node.dto';
import { UpdateWbsNodeDto } from './dto/update-wbs-node.dto';
import { WbsQueryDto } from './dto/wbs-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const PARENT_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateWbsNodeDto validation', () => {
  const valid = {
    projectId: PROJ_UUID,
    code: 'WBS-1.1',
    libelle: 'Phase de préparation',
    type: WbsNodeType.PHASE,
    ordre: 0,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateWbsNodeDto, valid)).toEqual([]);
  });

  it('accepts a valid payload with parent and objective', async () => {
    expect(
      await errorsFor(CreateWbsNodeDto, {
        ...valid,
        parentId: PARENT_UUID,
        objectiveId: PARENT_UUID,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, projectId: undefined })).toContain(
      'projectId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing libelle', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, libelle: '' })).toContain('libelle');
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, type: 'NOPE' })).toContain('type');
  });

  it('rejects an invalid parentId', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, parentId: 'nope' })).toContain('parentId');
  });

  it('rejects a negative ordre', async () => {
    expect(await errorsFor(CreateWbsNodeDto, { ...valid, ordre: -1 })).toContain('ordre');
  });

  it('does not declare niveau as a client-provided property', () => {
    const declared = Object.keys(new CreateWbsNodeDto() as unknown as Record<string, unknown>);
    expect(declared).not.toContain('niveau');
  });

  it('normalises the code (trim + uppercase) and trims the libelle', () => {
    const instance = plainToInstance(CreateWbsNodeDto, {
      ...valid,
      code: '  wbs-1.1 ',
      libelle: '  Phase  ',
    });
    expect(instance.code).toBe('WBS-1.1');
    expect(instance.libelle).toBe('Phase');
  });
});

describe('UpdateWbsNodeDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateWbsNodeDto, {})).toEqual([]);
  });

  it('accepts a boolean actif and a valid parentId', async () => {
    expect(await errorsFor(UpdateWbsNodeDto, { actif: false, parentId: PARENT_UUID })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateWbsNodeDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code, projectId or niveau as mutable properties', () => {
    const declared = Object.keys(new UpdateWbsNodeDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('projectId');
    expect(declared).not.toContain('niveau');
  });
});

describe('WbsQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(WbsQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(WbsQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts valid projectId, parentId, objectiveId and type filters', async () => {
    expect(
      await errorsFor(WbsQueryDto, {
        projectId: PROJ_UUID,
        parentId: PARENT_UUID,
        objectiveId: PARENT_UUID,
        type: WbsNodeType.LOT,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(WbsQueryDto, { type: 'NOPE' })).toContain('type');
  });
});
