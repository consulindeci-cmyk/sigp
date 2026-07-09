import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProgrammeStatus } from '@prisma/client';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { ProgrammeQueryDto } from './dto/programme-query.dto';

const UNI_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateProgrammeDto validation', () => {
  const valid = {
    uniteId: UNI_UUID,
    code: 'PRG-SANTE',
    nom: 'Programme Santé',
    description: 'Santé rurale',
    statut: ProgrammeStatus.EN_PREPARATION,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateProgrammeDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (uniteId + code + nom)', async () => {
    expect(
      await errorsFor(CreateProgrammeDto, { uniteId: UNI_UUID, code: 'X', nom: 'X Prog' }),
    ).toEqual([]);
  });

  it('rejects a missing uniteId', async () => {
    expect(await errorsFor(CreateProgrammeDto, { code: 'X', nom: 'X' })).toContain('uniteId');
  });

  it('rejects an invalid uniteId (not a UUID)', async () => {
    expect(await errorsFor(CreateProgrammeDto, { ...valid, uniteId: 'nope' })).toContain('uniteId');
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateProgrammeDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateProgrammeDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('rejects an invalid statut (not in ProgrammeStatus enum)', async () => {
    expect(await errorsFor(CreateProgrammeDto, { ...valid, statut: 'TERMINE_XX' })).toContain(
      'statut',
    );
  });

  it('normalises the code (trim + uppercase)', () => {
    const instance = plainToInstance(CreateProgrammeDto, { ...valid, code: '  prg-sante ' });
    expect(instance.code).toBe('PRG-SANTE');
  });

  it('trims the nom and description', () => {
    const instance = plainToInstance(CreateProgrammeDto, {
      ...valid,
      nom: '  Programme Santé  ',
      description: '  sante  ',
    });
    expect(instance.nom).toBe('Programme Santé');
    expect(instance.description).toBe('sante');
  });
});

describe('UpdateProgrammeDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateProgrammeDto, {})).toEqual([]);
  });

  it('accepts a valid statut', async () => {
    expect(await errorsFor(UpdateProgrammeDto, { statut: ProgrammeStatus.CLOTURE })).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdateProgrammeDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateProgrammeDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or uniteId as mutable properties', () => {
    const declared = Object.keys(new UpdateProgrammeDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('uniteId');
  });
});

describe('ProgrammeQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(ProgrammeQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(ProgrammeQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts a valid statut filter', async () => {
    expect(await errorsFor(ProgrammeQueryDto, { statut: ProgrammeStatus.EN_COURS })).toEqual([]);
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(ProgrammeQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects an invalid uniteId filter', async () => {
    expect(await errorsFor(ProgrammeQueryDto, { uniteId: 'nope' })).toContain('uniteId');
  });
});
