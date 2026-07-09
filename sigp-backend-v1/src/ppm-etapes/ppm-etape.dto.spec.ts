import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePpmEtapeDto } from './dto/create-ppm-etape.dto';
import { UpdatePpmEtapeDto } from './dto/update-ppm-etape.dto';
import { PpmEtapeQueryDto } from './dto/ppm-etape-query.dto';

const MARCHE_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreatePpmEtapeDto validation', () => {
  const valid = {
    marcheId: MARCHE_UUID,
    libelle: 'Publication de la demande de propositions',
    ordre: 1,
    datePrevue: '2026-03-01',
    dateReelle: '2026-03-15',
    complete: false,
    notes: 'Notes de étape',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (marcheId, libelle, ordre)', async () => {
    expect(
      await errorsFor(CreatePpmEtapeDto, {
        marcheId: MARCHE_UUID,
        libelle: 'Étape 1',
        ordre: 1,
      }),
    ).toEqual([]);
  });

  it('rejects a missing marcheId', async () => {
    const { marcheId: _marcheId, ...rest } = valid;
    expect(await errorsFor(CreatePpmEtapeDto, rest)).toContain('marcheId');
  });

  it('rejects an invalid marcheId UUID', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, marcheId: 'not-a-uuid' })).toContain(
      'marcheId',
    );
  });

  it('rejects a missing libelle', async () => {
    const { libelle: _libelle, ...rest } = valid;
    expect(await errorsFor(CreatePpmEtapeDto, rest)).toContain('libelle');
  });

  it('rejects a missing ordre', async () => {
    const { ordre: _ordre, ...rest } = valid;
    expect(await errorsFor(CreatePpmEtapeDto, rest)).toContain('ordre');
  });

  it('rejects a non-integer ordre', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, ordre: 1.5 })).toContain('ordre');
  });

  it('rejects a zero ordre', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, ordre: 0 })).toContain('ordre');
  });

  it('rejects a negative ordre', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, ordre: -1 })).toContain('ordre');
  });

  it('rejects an invalid datePrevue', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, datePrevue: 'not-a-date' })).toContain(
      'datePrevue',
    );
  });

  it('rejects an invalid dateReelle', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, dateReelle: 'not-a-date' })).toContain(
      'dateReelle',
    );
  });

  it('rejects a non-boolean complete', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, complete: 'nope' })).toContain(
      'complete',
    );
  });

  it('accepts complete = true', async () => {
    expect(await errorsFor(CreatePpmEtapeDto, { ...valid, complete: true })).toEqual([]);
  });
});

describe('UpdatePpmEtapeDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, {})).toEqual([]);
  });

  it('accepts a valid complete change', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, { complete: true })).toEqual([]);
  });

  it('rejects a non-boolean complete', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, { complete: 'yes' })).toContain('complete');
  });

  it('rejects a negative ordre', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, { ordre: -1 })).toContain('ordre');
  });

  it('rejects a non-integer ordre', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, { ordre: 2.5 })).toContain('ordre');
  });

  it('rejects an invalid dateReelle', async () => {
    expect(await errorsFor(UpdatePpmEtapeDto, { dateReelle: 'bad' })).toContain('dateReelle');
  });

  it('does not declare marcheId as a mutable property', () => {
    const declared = Object.keys(new UpdatePpmEtapeDto() as Record<string, unknown>);
    expect(declared).not.toContain('marcheId');
  });
});

describe('PpmEtapeQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(PpmEtapeQueryDto, {
        marcheId: MARCHE_UUID,
        complete: true,
        search: 'publication',
      }),
    ).toEqual([]);
  });

  it('rejects an invalid marcheId filter', async () => {
    expect(await errorsFor(PpmEtapeQueryDto, { marcheId: 'nope' })).toContain('marcheId');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(PpmEtapeQueryDto, {})).toEqual([]);
  });

  it('transforms string "true" to boolean true for complete filter', async () => {
    const instance = plainToInstance(PpmEtapeQueryDto, { complete: 'true' });
    expect(instance.complete).toBe(true);
  });

  it('transforms string "false" to boolean false for complete filter', async () => {
    const instance = plainToInstance(PpmEtapeQueryDto, { complete: 'false' });
    expect(instance.complete).toBe(false);
  });
});
