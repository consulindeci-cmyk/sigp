import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PtbaStatut } from '@prisma/client';
import { CreatePtbaActiviteDto } from './dto/create-ptba-activite.dto';
import { UpdatePtbaActiviteDto } from './dto/update-ptba-activite.dto';
import { PtbaQueryDto } from './dto/ptba-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const LINK_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreatePtbaActiviteDto validation', () => {
  const valid = {
    projectId: PROJ_UUID,
    code: 'ACT-2026-01',
    libelle: 'Formation des agents',
    annee: 2026,
    trimestre: 1,
    wbsId: LINK_UUID,
    logframeIndicatorId: LINK_UUID,
    montantPrevu: 5000000,
    tauxRealisation: 64,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId + code + libelle + annee + trimestre)', async () => {
    expect(
      await errorsFor(CreatePtbaActiviteDto, {
        projectId: PROJ_UUID,
        code: 'X',
        libelle: 'Y',
        annee: 2026,
        trimestre: 2,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(
      await errorsFor(CreatePtbaActiviteDto, {
        code: 'X',
        libelle: 'Y',
        annee: 2026,
        trimestre: 1,
      }),
    ).toContain('projectId');
  });

  it('rejects a missing annee', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, { ...valid, annee: undefined })).toContain(
      'annee',
    );
  });

  it('rejects an out-of-range trimestre', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, { ...valid, trimestre: 5 })).toContain(
      'trimestre',
    );
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, { ...valid, statut: 'NOPE' })).toContain(
      'statut',
    );
  });

  it('rejects an invalid wbsId', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, { ...valid, wbsId: 'nope' })).toContain('wbsId');
  });

  it('rejects a tauxRealisation above 100', async () => {
    expect(await errorsFor(CreatePtbaActiviteDto, { ...valid, tauxRealisation: 150 })).toContain(
      'tauxRealisation',
    );
  });

  it('normalises the code (trim + uppercase) and trims the libelle', () => {
    const instance = plainToInstance(CreatePtbaActiviteDto, {
      ...valid,
      code: '  act-2026-01 ',
      libelle: '  Formation  ',
    });
    expect(instance.code).toBe('ACT-2026-01');
    expect(instance.libelle).toBe('Formation');
  });
});

describe('UpdatePtbaActiviteDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdatePtbaActiviteDto, {})).toEqual([]);
  });

  it('accepts a valid statut and taux', async () => {
    expect(
      await errorsFor(UpdatePtbaActiviteDto, { statut: PtbaStatut.TERMINE, tauxRealisation: 100 }),
    ).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdatePtbaActiviteDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('does not declare code or projectId as mutable properties', () => {
    const declared = Object.keys(new UpdatePtbaActiviteDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    expect(declared).not.toContain('projectId');
  });
});

describe('PtbaQueryDto validation', () => {
  it('coerces annee/trimestre query strings to numbers', () => {
    const instance = plainToInstance(PtbaQueryDto, { annee: '2026', trimestre: '3' });
    expect(instance.annee).toBe(2026);
    expect(instance.trimestre).toBe(3);
  });

  it('accepts valid projectId, statut and wbsId filters', async () => {
    expect(
      await errorsFor(PtbaQueryDto, {
        projectId: PROJ_UUID,
        statut: PtbaStatut.EN_COURS,
        wbsId: LINK_UUID,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(PtbaQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects an out-of-range trimestre filter', async () => {
    expect(await errorsFor(PtbaQueryDto, { trimestre: '9' })).toContain('trimestre');
  });
});
