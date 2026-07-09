import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IndicatorType } from '@prisma/client';
import { CreateLogframeIndicatorDto } from './dto/create-logframe-indicator.dto';
import { UpdateLogframeIndicatorDto } from './dto/update-logframe-indicator.dto';
import { LogframeIndicatorQueryDto } from './dto/logframe-indicator-query.dto';

const OBJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateLogframeIndicatorDto validation', () => {
  const valid = {
    objectiveId: OBJ_UUID,
    code: 'IND-1',
    libelle: 'Taux de couverture vaccinale',
    type: IndicatorType.OUTPUT,
    unite: '%',
    valeurCible: 90,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateLogframeIndicatorDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (objectiveId + code + libelle)', async () => {
    expect(
      await errorsFor(CreateLogframeIndicatorDto, {
        objectiveId: OBJ_UUID,
        code: 'X',
        libelle: 'Indicateur',
      }),
    ).toEqual([]);
  });

  it('rejects a missing objectiveId', async () => {
    expect(await errorsFor(CreateLogframeIndicatorDto, { code: 'X', libelle: 'Y' })).toContain(
      'objectiveId',
    );
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateLogframeIndicatorDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing libelle', async () => {
    expect(await errorsFor(CreateLogframeIndicatorDto, { ...valid, libelle: '' })).toContain(
      'libelle',
    );
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateLogframeIndicatorDto, { ...valid, type: 'NOPE' })).toContain(
      'type',
    );
  });

  it('rejects a non-numeric valeurCible', async () => {
    expect(
      await errorsFor(CreateLogframeIndicatorDto, { ...valid, valeurCible: 'beaucoup' }),
    ).toContain('valeurCible');
  });

  it('normalises the code (trim + uppercase) and trims the libelle', () => {
    const instance = plainToInstance(CreateLogframeIndicatorDto, {
      ...valid,
      code: '  ind-1 ',
      libelle: '  Taux  ',
    });
    expect(instance.code).toBe('IND-1');
    expect(instance.libelle).toBe('Taux');
  });
});

describe('UpdateLogframeIndicatorDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateLogframeIndicatorDto, {})).toEqual([]);
  });

  it('accepts a boolean actif and numeric values', async () => {
    expect(
      await errorsFor(UpdateLogframeIndicatorDto, { actif: false, valeurActuelle: 62.3 }),
    ).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateLogframeIndicatorDto, { actif: 'yes' })).toContain('actif');
  });

  it('does not declare code or objectiveId as mutable properties', () => {
    const declared = Object.keys(new UpdateLogframeIndicatorDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('objectiveId');
  });
});

describe('LogframeIndicatorQueryDto validation', () => {
  it('transforms actif="true" into a boolean', () => {
    const instance = plainToInstance(LogframeIndicatorQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(LogframeIndicatorQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('accepts valid objectiveId and type filters', async () => {
    expect(
      await errorsFor(LogframeIndicatorQueryDto, {
        objectiveId: OBJ_UUID,
        type: IndicatorType.OUTCOME,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(LogframeIndicatorQueryDto, { type: 'NOPE' })).toContain('type');
  });
});
