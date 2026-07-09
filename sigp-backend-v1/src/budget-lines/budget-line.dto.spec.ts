import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBudgetLineDto } from './dto/create-budget-line.dto';
import { UpdateBudgetLineDto } from './dto/update-budget-line.dto';
import { BudgetLineQueryDto } from './dto/budget-line-query.dto';

const VERSION_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const PARENT_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateBudgetLineDto validation', () => {
  const valid = {
    versionId: VERSION_UUID,
    parentId: PARENT_UUID,
    codeLigne: 'PERS-001',
    libelle: 'Personnel permanent',
    categorie: 'Ressources humaines',
    montantPrevu: 50000000,
    montantEngage: 10000000,
    montantPaye: 5000000,
    ordre: 1,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateBudgetLineDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (versionId + codeLigne + libelle)', async () => {
    expect(
      await errorsFor(CreateBudgetLineDto, {
        versionId: VERSION_UUID,
        codeLigne: 'X',
        libelle: 'Y',
      }),
    ).toEqual([]);
  });

  it('rejects a missing versionId', async () => {
    expect(await errorsFor(CreateBudgetLineDto, { codeLigne: 'X', libelle: 'Y' })).toContain(
      'versionId',
    );
  });

  it('rejects a missing codeLigne', async () => {
    expect(
      await errorsFor(CreateBudgetLineDto, { versionId: VERSION_UUID, libelle: 'Y' }),
    ).toContain('codeLigne');
  });

  it('rejects a missing libelle', async () => {
    expect(
      await errorsFor(CreateBudgetLineDto, { versionId: VERSION_UUID, codeLigne: 'X' }),
    ).toContain('libelle');
  });

  it('rejects an invalid parentId UUID', async () => {
    expect(await errorsFor(CreateBudgetLineDto, { ...valid, parentId: 'nope' })).toContain(
      'parentId',
    );
  });

  it('rejects a negative montantPrevu', async () => {
    expect(await errorsFor(CreateBudgetLineDto, { ...valid, montantPrevu: -1 })).toContain(
      'montantPrevu',
    );
  });

  it('rejects a negative montantEngage', async () => {
    expect(await errorsFor(CreateBudgetLineDto, { ...valid, montantEngage: -1 })).toContain(
      'montantEngage',
    );
  });

  it('rejects a negative montantPaye', async () => {
    expect(await errorsFor(CreateBudgetLineDto, { ...valid, montantPaye: -1 })).toContain(
      'montantPaye',
    );
  });

  it('normalises codeLigne (trim + uppercase) and trims libelle', () => {
    const instance = plainToInstance(CreateBudgetLineDto, {
      ...valid,
      codeLigne: '  pers-001 ',
      libelle: '  Personnel permanent  ',
    });
    expect(instance.codeLigne).toBe('PERS-001');
    expect(instance.libelle).toBe('Personnel permanent');
  });
});

describe('UpdateBudgetLineDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateBudgetLineDto, {})).toEqual([]);
  });

  it('accepts a valid montantEngage update', async () => {
    expect(await errorsFor(UpdateBudgetLineDto, { montantEngage: 12000000 })).toEqual([]);
  });

  it('rejects a negative montantPaye', async () => {
    expect(await errorsFor(UpdateBudgetLineDto, { montantPaye: -5 })).toContain('montantPaye');
  });

  it('rejects an invalid parentId UUID', async () => {
    expect(await errorsFor(UpdateBudgetLineDto, { parentId: 'not-a-uuid' })).toContain('parentId');
  });

  it('does not declare versionId or codeLigne as mutable properties', () => {
    const declared = Object.keys(new UpdateBudgetLineDto() as Record<string, unknown>);
    expect(declared).not.toContain('versionId');
    expect(declared).not.toContain('codeLigne');
  });
});

describe('BudgetLineQueryDto validation', () => {
  it('accepts valid versionId and parentId filters', async () => {
    expect(
      await errorsFor(BudgetLineQueryDto, { versionId: VERSION_UUID, parentId: PARENT_UUID }),
    ).toEqual([]);
  });

  it('rejects an invalid versionId filter', async () => {
    expect(await errorsFor(BudgetLineQueryDto, { versionId: 'nope' })).toContain('versionId');
  });

  it('rejects an invalid parentId filter', async () => {
    expect(await errorsFor(BudgetLineQueryDto, { parentId: 'nope' })).toContain('parentId');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(BudgetLineQueryDto, {})).toEqual([]);
  });
});
