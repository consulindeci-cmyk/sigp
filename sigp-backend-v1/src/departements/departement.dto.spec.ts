import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { DepartementQueryDto } from './dto/departement-query.dto';

const DIR_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateDepartementDto validation', () => {
  const valid = {
    directionId: DIR_UUID,
    code: 'DEP-SI',
    nom: 'Département SI',
    description: 'Infrastructure',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateDepartementDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (directionId + code + nom)', async () => {
    expect(
      await errorsFor(CreateDepartementDto, { directionId: DIR_UUID, code: 'X', nom: 'X Dep' }),
    ).toEqual([]);
  });

  it('rejects a missing directionId', async () => {
    expect(await errorsFor(CreateDepartementDto, { code: 'X', nom: 'X' })).toContain('directionId');
  });

  it('rejects an invalid directionId (not a UUID)', async () => {
    expect(await errorsFor(CreateDepartementDto, { ...valid, directionId: 'nope' })).toContain(
      'directionId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateDepartementDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateDepartementDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('normalises the code (trim + uppercase)', () => {
    const instance = plainToInstance(CreateDepartementDto, { ...valid, code: '  dep-si ' });
    expect(instance.code).toBe('DEP-SI');
  });

  it('trims the nom and description', () => {
    const instance = plainToInstance(CreateDepartementDto, {
      ...valid,
      nom: '  Département SI  ',
      description: '  infra  ',
    });
    expect(instance.nom).toBe('Département SI');
    expect(instance.description).toBe('infra');
  });
});

describe('UpdateDepartementDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateDepartementDto, {})).toEqual([]);
  });

  it('accepts a boolean actif', async () => {
    expect(await errorsFor(UpdateDepartementDto, { actif: false })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateDepartementDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or directionId as mutable properties', () => {
    const declared = Object.keys(new UpdateDepartementDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('directionId');
  });
});

describe('DepartementQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(DepartementQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('transforms actif="false" into a boolean', () => {
    const instance = plainToInstance(DepartementQueryDto, { actif: 'false' });
    expect(instance.actif).toBe(false);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(DepartementQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('rejects an invalid directionId filter', async () => {
    expect(await errorsFor(DepartementQueryDto, { directionId: 'nope' })).toContain('directionId');
  });
});
