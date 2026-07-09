import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FundingSourceType } from '@prisma/client';
import { CreateFundingSourceDto } from './dto/create-funding-source.dto';
import { UpdateFundingSourceDto } from './dto/update-funding-source.dto';
import { FundingSourceQueryDto } from './dto/funding-source-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateFundingSourceDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    nom: 'Banque Mondiale',
    type: FundingSourceType.BAILLEUR,
    montant: 5000000000,
    pourcentage: 75,
    devise: 'XOF',
    dateAccord: '2026-01-15',
    dateExpiry: '2030-12-31',
    contact: 'contact@worldbank.org',
    notes: 'Composante 1',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateFundingSourceDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId + nom + montant)', async () => {
    expect(
      await errorsFor(CreateFundingSourceDto, {
        projectId: PROJECT_UUID,
        nom: 'BAD',
        montant: 1000000,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _projectId, ...rest } = valid;
    expect(await errorsFor(CreateFundingSourceDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId UUID', async () => {
    expect(
      await errorsFor(CreateFundingSourceDto, { ...valid, projectId: 'not-a-uuid' }),
    ).toContain('projectId');
  });

  it('rejects a missing nom', async () => {
    const { nom: _nom, ...rest } = valid;
    expect(await errorsFor(CreateFundingSourceDto, rest)).toContain('nom');
  });

  it('rejects a missing montant', async () => {
    const { montant: _montant, ...rest } = valid;
    expect(await errorsFor(CreateFundingSourceDto, rest)).toContain('montant');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(CreateFundingSourceDto, { ...valid, montant: -1 })).toContain('montant');
  });

  it('rejects a pourcentage above 100', async () => {
    expect(await errorsFor(CreateFundingSourceDto, { ...valid, pourcentage: 101 })).toContain(
      'pourcentage',
    );
  });

  it('rejects a negative pourcentage', async () => {
    expect(await errorsFor(CreateFundingSourceDto, { ...valid, pourcentage: -1 })).toContain(
      'pourcentage',
    );
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateFundingSourceDto, { ...valid, type: 'NOPE' })).toContain('type');
  });

  it('accepts all three FundingSourceType values', async () => {
    for (const type of [
      FundingSourceType.BAILLEUR,
      FundingSourceType.CONTREPARTIE_NATIONALE,
      FundingSourceType.AUTRE,
    ]) {
      expect(await errorsFor(CreateFundingSourceDto, { ...valid, type })).toEqual([]);
    }
  });

  it('rejects an invalid dateAccord', async () => {
    expect(
      await errorsFor(CreateFundingSourceDto, { ...valid, dateAccord: 'not-a-date' }),
    ).toContain('dateAccord');
  });

  it('rejects an invalid dateExpiry', async () => {
    expect(
      await errorsFor(CreateFundingSourceDto, { ...valid, dateExpiry: 'not-a-date' }),
    ).toContain('dateExpiry');
  });

  it('trims the nom field', () => {
    const instance = plainToInstance(CreateFundingSourceDto, { ...valid, nom: '  Banque  ' });
    expect(instance.nom).toBe('Banque');
  });

  it('trims the devise field', () => {
    const instance = plainToInstance(CreateFundingSourceDto, { ...valid, devise: ' EUR ' });
    expect(instance.devise).toBe('EUR');
  });
});

describe('UpdateFundingSourceDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateFundingSourceDto, {})).toEqual([]);
  });

  it('accepts a valid type change', async () => {
    expect(
      await errorsFor(UpdateFundingSourceDto, { type: FundingSourceType.CONTREPARTIE_NATIONALE }),
    ).toEqual([]);
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(UpdateFundingSourceDto, { type: 'NOPE' })).toContain('type');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(UpdateFundingSourceDto, { montant: -100 })).toContain('montant');
  });

  it('rejects an invalid dateAccord', async () => {
    expect(await errorsFor(UpdateFundingSourceDto, { dateAccord: 'bad-date' })).toContain(
      'dateAccord',
    );
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateFundingSourceDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

describe('FundingSourceQueryDto validation', () => {
  it('accepts valid projectId and type filters', async () => {
    expect(
      await errorsFor(FundingSourceQueryDto, {
        projectId: PROJECT_UUID,
        type: FundingSourceType.BAILLEUR,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(FundingSourceQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(FundingSourceQueryDto, { type: 'NOPE' })).toContain('type');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(FundingSourceQueryDto, {})).toEqual([]);
  });
});
