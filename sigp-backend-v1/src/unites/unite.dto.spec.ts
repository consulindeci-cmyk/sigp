import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUniteDto } from './dto/create-unite.dto';
import { UpdateUniteDto } from './dto/update-unite.dto';
import { UniteQueryDto } from './dto/unite-query.dto';

const DEP_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateUniteDto validation', () => {
  const valid = {
    departementId: DEP_UUID,
    code: 'UNI-RESEAU',
    nom: 'Unité Réseau',
    description: 'Réseau et télécoms',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateUniteDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (departementId + code + nom)', async () => {
    expect(
      await errorsFor(CreateUniteDto, { departementId: DEP_UUID, code: 'X', nom: 'X Unite' }),
    ).toEqual([]);
  });

  it('rejects a missing departementId', async () => {
    expect(await errorsFor(CreateUniteDto, { code: 'X', nom: 'X' })).toContain('departementId');
  });

  it('rejects an invalid departementId (not a UUID)', async () => {
    expect(await errorsFor(CreateUniteDto, { ...valid, departementId: 'nope' })).toContain(
      'departementId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateUniteDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateUniteDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('normalises the code (trim + uppercase)', () => {
    const instance = plainToInstance(CreateUniteDto, { ...valid, code: '  uni-reseau ' });
    expect(instance.code).toBe('UNI-RESEAU');
  });

  it('trims the nom and description', () => {
    const instance = plainToInstance(CreateUniteDto, {
      ...valid,
      nom: '  Unité Réseau  ',
      description: '  reseau  ',
    });
    expect(instance.nom).toBe('Unité Réseau');
    expect(instance.description).toBe('reseau');
  });
});

describe('UpdateUniteDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateUniteDto, {})).toEqual([]);
  });

  it('accepts a boolean actif', async () => {
    expect(await errorsFor(UpdateUniteDto, { actif: false })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateUniteDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or departementId as mutable properties', () => {
    const declared = Object.keys(new UpdateUniteDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('departementId');
  });
});

describe('UniteQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(UniteQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('transforms actif="false" into a boolean', () => {
    const instance = plainToInstance(UniteQueryDto, { actif: 'false' });
    expect(instance.actif).toBe(false);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(UniteQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('rejects an invalid departementId filter', async () => {
    expect(await errorsFor(UniteQueryDto, { departementId: 'nope' })).toContain('departementId');
  });
});
