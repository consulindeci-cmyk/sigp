import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PpmMarcheStatus, PpmTypeMarche } from '@prisma/client';
import { CreatePpmMarcheDto } from './dto/create-ppm-marche.dto';
import { UpdatePpmMarcheDto } from './dto/update-ppm-marche.dto';
import { PpmQueryDto } from './dto/ppm-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreatePpmMarcheDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    code: 'MRC-2026-001',
    intitule: 'Acquisition de matériel informatique',
    type: PpmTypeMarche.FOURNITURES,
    statut: PpmMarcheStatus.EN_PREPARATION,
    montantEstime: 5000000,
    montantSigne: 4500000,
    dateLancementPrevu: '2026-03-01',
    dateSoumissionPrevu: '2026-04-01',
    dateAttribution: '2026-05-01',
    dateSignature: '2026-06-01',
    dateFinPrevue: '2026-12-31',
    dateFinEffective: '2026-12-20',
    titulaire: 'Entreprise Beta',
    notes: 'Notes du marché',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId, code, intitule, type)', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, {
        projectId: PROJECT_UUID,
        code: 'MRC-001',
        intitule: 'Acquisition matériel',
        type: PpmTypeMarche.FOURNITURES,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _projectId, ...rest } = valid;
    expect(await errorsFor(CreatePpmMarcheDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId UUID', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, { ...valid, projectId: 'not-a-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing code', async () => {
    const { code: _code, ...rest } = valid;
    expect(await errorsFor(CreatePpmMarcheDto, rest)).toContain('code');
  });

  it('rejects a missing intitule', async () => {
    const { intitule: _intitule, ...rest } = valid;
    expect(await errorsFor(CreatePpmMarcheDto, rest)).toContain('intitule');
  });

  it('rejects a missing type', async () => {
    const { type: _type, ...rest } = valid;
    expect(await errorsFor(CreatePpmMarcheDto, rest)).toContain('type');
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, { ...valid, type: 'NOPE' })).toContain('type');
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, { ...valid, statut: 'NOPE' })).toContain('statut');
  });

  it('accepts all four PpmTypeMarche values', async () => {
    for (const type of [
      PpmTypeMarche.FOURNITURES,
      PpmTypeMarche.TRAVAUX,
      PpmTypeMarche.SERVICES,
      PpmTypeMarche.CONSULTANTS,
    ]) {
      expect(await errorsFor(CreatePpmMarcheDto, { ...valid, type })).toEqual([]);
    }
  });

  it('accepts all eight PpmMarcheStatus values', async () => {
    for (const statut of [
      PpmMarcheStatus.EN_PREPARATION,
      PpmMarcheStatus.LANCE,
      PpmMarcheStatus.SOUMISSION,
      PpmMarcheStatus.EVALUATION,
      PpmMarcheStatus.ATTRIBUTION,
      PpmMarcheStatus.SIGNE,
      PpmMarcheStatus.RESILIE,
      PpmMarcheStatus.CLOTURE,
    ]) {
      expect(await errorsFor(CreatePpmMarcheDto, { ...valid, statut })).toEqual([]);
    }
  });

  it('rejects a negative montantEstime', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, { ...valid, montantEstime: -1 })).toContain(
      'montantEstime',
    );
  });

  it('rejects a negative montantSigne', async () => {
    expect(await errorsFor(CreatePpmMarcheDto, { ...valid, montantSigne: -100 })).toContain(
      'montantSigne',
    );
  });

  it('rejects an invalid dateLancementPrevu', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateLancementPrevu: 'not-a-date' }),
    ).toContain('dateLancementPrevu');
  });

  it('rejects an invalid dateSoumissionPrevu', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateSoumissionPrevu: 'not-a-date' }),
    ).toContain('dateSoumissionPrevu');
  });

  it('rejects an invalid dateAttribution', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateAttribution: 'not-a-date' }),
    ).toContain('dateAttribution');
  });

  it('rejects an invalid dateSignature', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateSignature: 'not-a-date' }),
    ).toContain('dateSignature');
  });

  it('rejects an invalid dateFinPrevue', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateFinPrevue: 'not-a-date' }),
    ).toContain('dateFinPrevue');
  });

  it('rejects an invalid dateFinEffective', async () => {
    expect(
      await errorsFor(CreatePpmMarcheDto, { ...valid, dateFinEffective: 'not-a-date' }),
    ).toContain('dateFinEffective');
  });
});

describe('UpdatePpmMarcheDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, { statut: PpmMarcheStatus.SIGNE })).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a negative montantEstime', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, { montantEstime: -100 })).toContain('montantEstime');
  });

  it('rejects an invalid dateFinEffective', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, { dateFinEffective: 'bad' })).toContain(
      'dateFinEffective',
    );
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(UpdatePpmMarcheDto, { type: 'NOPE' })).toContain('type');
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdatePpmMarcheDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

describe('PpmQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(PpmQueryDto, {
        projectId: PROJECT_UUID,
        type: PpmTypeMarche.TRAVAUX,
        statut: PpmMarcheStatus.LANCE,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(PpmQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(PpmQueryDto, { type: 'NOPE' })).toContain('type');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(PpmQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(PpmQueryDto, {})).toEqual([]);
  });
});
