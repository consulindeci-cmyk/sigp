import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BudgetStatus } from '@prisma/client';
import { CreateBudgetVersionDto } from './dto/create-budget-version.dto';
import { UpdateBudgetVersionDto } from './dto/update-budget-version.dto';
import { BudgetVersionQueryDto } from './dto/budget-version-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const USER_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateBudgetVersionDto validation', () => {
  const valid = {
    projectId: PROJ_UUID,
    nom: 'Budget initial 2026',
    version: 1,
    statut: BudgetStatus.BROUILLON,
    montantTotal: 150000000,
    approvePar: USER_UUID,
    approuveLe: '2026-03-15',
    notes: 'Approuvé en comité',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId + nom)', async () => {
    expect(
      await errorsFor(CreateBudgetVersionDto, { projectId: PROJ_UUID, nom: 'Budget' }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { nom: 'Budget' })).toContain('projectId');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { projectId: PROJ_UUID })).toContain('nom');
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { ...valid, statut: 'NOPE' })).toContain(
      'statut',
    );
  });

  it('rejects a version below 1', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { ...valid, version: 0 })).toContain('version');
  });

  it('rejects a negative montantTotal', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { ...valid, montantTotal: -1 })).toContain(
      'montantTotal',
    );
  });

  it('rejects an invalid approvePar UUID', async () => {
    expect(await errorsFor(CreateBudgetVersionDto, { ...valid, approvePar: 'nope' })).toContain(
      'approvePar',
    );
  });

  it('rejects an invalid approuveLe date', async () => {
    expect(
      await errorsFor(CreateBudgetVersionDto, { ...valid, approuveLe: 'not-a-date' }),
    ).toContain('approuveLe');
  });

  it('trims the nom', () => {
    const instance = plainToInstance(CreateBudgetVersionDto, {
      ...valid,
      nom: '  Budget initial 2026  ',
    });
    expect(instance.nom).toBe('Budget initial 2026');
  });
});

describe('UpdateBudgetVersionDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateBudgetVersionDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateBudgetVersionDto, { statut: BudgetStatus.SOUMIS })).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdateBudgetVersionDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a negative montantTotal', async () => {
    expect(await errorsFor(UpdateBudgetVersionDto, { montantTotal: -5 })).toContain('montantTotal');
  });

  it('does not declare projectId or version as mutable properties', () => {
    const declared = Object.keys(new UpdateBudgetVersionDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
    expect(declared).not.toContain('version');
  });
});

describe('BudgetVersionQueryDto validation', () => {
  it('coerces version query string to a number', () => {
    const instance = plainToInstance(BudgetVersionQueryDto, { version: '2' });
    expect(instance.version).toBe(2);
  });

  it('accepts valid projectId and statut filters', async () => {
    expect(
      await errorsFor(BudgetVersionQueryDto, {
        projectId: PROJ_UUID,
        statut: BudgetStatus.APPROUVE,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(BudgetVersionQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a version below 1', async () => {
    expect(await errorsFor(BudgetVersionQueryDto, { version: '0' })).toContain('version');
  });
});
