import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';
import { DirectionQueryDto } from './dto/direction-query.dto';

const ORG_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateDirectionDto validation', () => {
  const valid = {
    organisationId: ORG_UUID,
    code: 'DIR-TECH',
    nom: 'Direction Technique',
    description: 'Direction en charge des systèmes',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateDirectionDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (organisationId + code + nom)', async () => {
    expect(
      await errorsFor(CreateDirectionDto, {
        organisationId: ORG_UUID,
        code: 'X',
        nom: 'X Dir',
      }),
    ).toEqual([]);
  });

  it('rejects a missing organisationId', async () => {
    expect(await errorsFor(CreateDirectionDto, { code: 'X', nom: 'X' })).toContain(
      'organisationId',
    );
  });

  it('rejects an invalid organisationId (not a UUID)', async () => {
    expect(await errorsFor(CreateDirectionDto, { ...valid, organisationId: 'nope' })).toContain(
      'organisationId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateDirectionDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateDirectionDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('normalises the code (trim + uppercase)', () => {
    const instance = plainToInstance(CreateDirectionDto, { ...valid, code: '  dir-tech ' });
    expect(instance.code).toBe('DIR-TECH');
  });

  it('trims the nom and description', () => {
    const instance = plainToInstance(CreateDirectionDto, {
      ...valid,
      nom: '  Direction Technique  ',
      description: '  desc  ',
    });
    expect(instance.nom).toBe('Direction Technique');
    expect(instance.description).toBe('desc');
  });
});

describe('UpdateDirectionDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateDirectionDto, {})).toEqual([]);
  });

  it('accepts a boolean actif', async () => {
    expect(await errorsFor(UpdateDirectionDto, { actif: false })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateDirectionDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or organisationId as mutable properties', () => {
    const declared = Object.keys(new UpdateDirectionDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('organisationId');
  });
});

describe('DirectionQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(DirectionQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('transforms actif="false" into a boolean', () => {
    const instance = plainToInstance(DirectionQueryDto, { actif: 'false' });
    expect(instance.actif).toBe(false);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(DirectionQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('rejects an invalid organisationId filter', async () => {
    expect(await errorsFor(DirectionQueryDto, { organisationId: 'nope' })).toContain(
      'organisationId',
    );
  });
});
