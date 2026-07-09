import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DisbursementStatus } from '@prisma/client';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';

const VERSION_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const LINE_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';
const SOURCE_UUID = 'c3d4e5f6-0000-4000-8000-ef1234567890';
const CONTRACT_UUID = 'd4e5f6a7-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateDisbursementDto validation', () => {
  const valid = {
    budgetVersionId: VERSION_UUID,
    budgetLineId: LINE_UUID,
    contractId: CONTRACT_UUID,
    fundingSourceId: SOURCE_UUID,
    statut: DisbursementStatus.PLANIFIE,
    montant: 5000000,
    datePrevue: '2026-06-01',
    dateReelle: '2026-06-15',
    reference: 'DEC-2026-001',
    description: 'Premier décaissement',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateDisbursementDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (montant only)', async () => {
    expect(await errorsFor(CreateDisbursementDto, { montant: 1000 })).toEqual([]);
  });

  it('rejects a missing montant', async () => {
    const { montant: _montant, ...rest } = valid;
    expect(await errorsFor(CreateDisbursementDto, rest)).toContain('montant');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(CreateDisbursementDto, { ...valid, montant: -1 })).toContain('montant');
  });

  it('rejects an invalid budgetVersionId UUID', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, budgetVersionId: 'not-a-uuid' }),
    ).toContain('budgetVersionId');
  });

  it('rejects an invalid budgetLineId UUID', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, budgetLineId: 'not-a-uuid' }),
    ).toContain('budgetLineId');
  });

  it('rejects an invalid fundingSourceId UUID', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, fundingSourceId: 'not-a-uuid' }),
    ).toContain('fundingSourceId');
  });

  it('rejects an invalid contractId UUID', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, contractId: 'not-a-uuid' }),
    ).toContain('contractId');
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreateDisbursementDto, { ...valid, statut: 'NOPE' })).toContain(
      'statut',
    );
  });

  it('accepts all five DisbursementStatus values', async () => {
    for (const statut of [
      DisbursementStatus.PLANIFIE,
      DisbursementStatus.DEMANDE,
      DisbursementStatus.APPROUVE,
      DisbursementStatus.DECAISSE,
      DisbursementStatus.REJETE,
    ]) {
      expect(await errorsFor(CreateDisbursementDto, { ...valid, statut })).toEqual([]);
    }
  });

  it('rejects an invalid datePrevue', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, datePrevue: 'not-a-date' }),
    ).toContain('datePrevue');
  });

  it('rejects an invalid dateReelle', async () => {
    expect(
      await errorsFor(CreateDisbursementDto, { ...valid, dateReelle: 'not-a-date' }),
    ).toContain('dateReelle');
  });

  it('trims the reference field', () => {
    const instance = plainToInstance(CreateDisbursementDto, { ...valid, reference: '  DEC-001  ' });
    expect(instance.reference).toBe('DEC-001');
  });
});

describe('UpdateDisbursementDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateDisbursementDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateDisbursementDto, { statut: DisbursementStatus.APPROUVE })).toEqual(
      [],
    );
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdateDisbursementDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(UpdateDisbursementDto, { montant: -100 })).toContain('montant');
  });

  it('rejects an invalid datePrevue', async () => {
    expect(await errorsFor(UpdateDisbursementDto, { datePrevue: 'bad' })).toContain('datePrevue');
  });

  it('rejects an invalid contractId UUID', async () => {
    expect(await errorsFor(UpdateDisbursementDto, { contractId: 'nope' })).toContain('contractId');
  });

  it('does not declare budgetVersionId as a mutable property', () => {
    const declared = Object.keys(new UpdateDisbursementDto() as Record<string, unknown>);
    expect(declared).not.toContain('budgetVersionId');
  });

  it('does not declare budgetLineId as a mutable property', () => {
    const declared = Object.keys(new UpdateDisbursementDto() as Record<string, unknown>);
    expect(declared).not.toContain('budgetLineId');
  });

  it('does not declare fundingSourceId as a mutable property', () => {
    const declared = Object.keys(new UpdateDisbursementDto() as Record<string, unknown>);
    expect(declared).not.toContain('fundingSourceId');
  });
});

describe('DisbursementQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(DisbursementQueryDto, {
        budgetVersionId: VERSION_UUID,
        budgetLineId: LINE_UUID,
        fundingSourceId: SOURCE_UUID,
        statut: DisbursementStatus.DECAISSE,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid budgetVersionId filter', async () => {
    expect(await errorsFor(DisbursementQueryDto, { budgetVersionId: 'nope' })).toContain(
      'budgetVersionId',
    );
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(DisbursementQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(DisbursementQueryDto, {})).toEqual([]);
  });
});
