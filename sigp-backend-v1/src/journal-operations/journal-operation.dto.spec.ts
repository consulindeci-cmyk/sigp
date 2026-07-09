import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JournalType } from '@prisma/client';
import { CreateJournalOperationDto } from './dto/create-journal-operation.dto';
import { UpdateJournalOperationDto } from './dto/update-journal-operation.dto';
import { JournalOperationQueryDto } from './dto/journal-operation-query.dto';

const LINE_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const PJ_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateJournalOperationDto validation', () => {
  const valid = {
    budgetLineId: LINE_UUID,
    type: JournalType.DEPENSE,
    montant: 5000000,
    dateOperation: '2026-03-15',
    reference: 'BON-2026-001',
    description: 'Paiement salaires',
    pieceJointeId: PJ_UUID,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateJournalOperationDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (budgetLineId + type + montant + dateOperation)', async () => {
    expect(
      await errorsFor(CreateJournalOperationDto, {
        budgetLineId: LINE_UUID,
        type: JournalType.RECETTE,
        montant: 1000,
        dateOperation: '2026-01-01',
      }),
    ).toEqual([]);
  });

  it('rejects a missing budgetLineId', async () => {
    const { budgetLineId: _budgetLineId, ...rest } = valid;
    expect(await errorsFor(CreateJournalOperationDto, rest)).toContain('budgetLineId');
  });

  it('rejects a missing type', async () => {
    const { type: _type, ...rest } = valid;
    expect(await errorsFor(CreateJournalOperationDto, rest)).toContain('type');
  });

  it('rejects a missing montant', async () => {
    const { montant: _montant, ...rest } = valid;
    expect(await errorsFor(CreateJournalOperationDto, rest)).toContain('montant');
  });

  it('rejects a missing dateOperation', async () => {
    const { dateOperation: _dateOperation, ...rest } = valid;
    expect(await errorsFor(CreateJournalOperationDto, rest)).toContain('dateOperation');
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateJournalOperationDto, { ...valid, type: 'NOPE' })).toContain(
      'type',
    );
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(CreateJournalOperationDto, { ...valid, montant: -1 })).toContain(
      'montant',
    );
  });

  it('rejects an invalid dateOperation', async () => {
    expect(
      await errorsFor(CreateJournalOperationDto, { ...valid, dateOperation: 'not-a-date' }),
    ).toContain('dateOperation');
  });

  it('rejects an invalid pieceJointeId UUID', async () => {
    expect(
      await errorsFor(CreateJournalOperationDto, { ...valid, pieceJointeId: 'nope' }),
    ).toContain('pieceJointeId');
  });

  it('accepts all three JournalType values', async () => {
    for (const type of [JournalType.RECETTE, JournalType.DEPENSE, JournalType.VIREMENT]) {
      expect(await errorsFor(CreateJournalOperationDto, { ...valid, type })).toEqual([]);
    }
  });

  it('trims the reference field', () => {
    const instance = plainToInstance(CreateJournalOperationDto, {
      ...valid,
      reference: '  BON-2026-001  ',
    });
    expect(instance.reference).toBe('BON-2026-001');
  });
});

describe('UpdateJournalOperationDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateJournalOperationDto, {})).toEqual([]);
  });

  it('accepts a valid type change', async () => {
    expect(await errorsFor(UpdateJournalOperationDto, { type: JournalType.VIREMENT })).toEqual([]);
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(UpdateJournalOperationDto, { type: 'NOPE' })).toContain('type');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(UpdateJournalOperationDto, { montant: -100 })).toContain('montant');
  });

  it('rejects an invalid dateOperation', async () => {
    expect(await errorsFor(UpdateJournalOperationDto, { dateOperation: 'bad-date' })).toContain(
      'dateOperation',
    );
  });

  it('does not declare budgetLineId as a mutable property', () => {
    const declared = Object.keys(new UpdateJournalOperationDto() as Record<string, unknown>);
    expect(declared).not.toContain('budgetLineId');
  });
});

describe('JournalOperationQueryDto validation', () => {
  it('accepts valid budgetLineId and type filters', async () => {
    expect(
      await errorsFor(JournalOperationQueryDto, {
        budgetLineId: LINE_UUID,
        type: JournalType.RECETTE,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid budgetLineId filter', async () => {
    expect(await errorsFor(JournalOperationQueryDto, { budgetLineId: 'nope' })).toContain(
      'budgetLineId',
    );
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(JournalOperationQueryDto, { type: 'NOPE' })).toContain('type');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(JournalOperationQueryDto, {})).toEqual([]);
  });
});
