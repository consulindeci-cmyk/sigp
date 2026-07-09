import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LivrableStatus } from '@prisma/client';
import { CreateLivrableDto } from './dto/create-livrable.dto';
import { UpdateLivrableDto } from './dto/update-livrable.dto';
import { LivrableQueryDto } from './dto/livrable-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateLivrableDto ───────────────────────────────────────────────────────

describe('CreateLivrableDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    nom: 'Rapport de lancement',
  };

  it('accepts a minimal valid payload', async () => {
    expect(await errorsFor(CreateLivrableDto, valid)).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    expect(
      await errorsFor(CreateLivrableDto, {
        ...valid,
        wbsId: PROJECT_UUID,
        code: 'LIV-001',
        description: 'Description détaillée',
        statut: LivrableStatus.EN_COURS,
        datePrevue: '2026-06-01',
        dateSoumission: '2026-07-01',
        dateValidation: '2026-07-15',
        responsableId: PROJECT_UUID,
        validateurId: PROJECT_UUID,
        notes: 'Notes libres',
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _p, ...rest } = valid;
    expect(await errorsFor(CreateLivrableDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, projectId: 'not-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing nom', async () => {
    const { nom: _n, ...rest } = valid;
    expect(await errorsFor(CreateLivrableDto, rest)).toContain('nom');
  });

  it('rejects a nom exceeding 300 characters', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, nom: 'X'.repeat(301) })).toContain('nom');
  });

  it('accepts a nom of exactly 300 characters', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, nom: 'X'.repeat(300) })).not.toContain(
      'nom',
    );
  });

  it('rejects a code exceeding 20 characters', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, code: 'X'.repeat(21) })).toContain(
      'code',
    );
  });

  it('accepts a code of exactly 20 characters', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, code: 'X'.repeat(20) })).not.toContain(
      'code',
    );
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, statut: 'ARCHIVE' })).toContain('statut');
  });

  it('accepts all valid LivrableStatus values', async () => {
    for (const stat of Object.values(LivrableStatus)) {
      expect(await errorsFor(CreateLivrableDto, { ...valid, statut: stat })).not.toContain(
        'statut',
      );
    }
  });

  it('rejects an invalid datePrevue', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, datePrevue: 'not-a-date' })).toContain(
      'datePrevue',
    );
  });

  it('rejects an invalid dateSoumission', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, dateSoumission: 'bad-date' })).toContain(
      'dateSoumission',
    );
  });

  it('rejects an invalid dateValidation', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, dateValidation: 'wrong' })).toContain(
      'dateValidation',
    );
  });

  it('rejects an invalid wbsId (not UUID)', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, wbsId: 'not-uuid' })).toContain('wbsId');
  });

  it('rejects an invalid responsableId (not UUID)', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, responsableId: 'not-uuid' })).toContain(
      'responsableId',
    );
  });

  it('rejects an invalid validateurId (not UUID)', async () => {
    expect(await errorsFor(CreateLivrableDto, { ...valid, validateurId: 'not-uuid' })).toContain(
      'validateurId',
    );
  });
});

// ─── UpdateLivrableDto ───────────────────────────────────────────────────────

describe('UpdateLivrableDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateLivrableDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateLivrableDto, { statut: LivrableStatus.SOUMIS })).toEqual([]);
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(UpdateLivrableDto, { statut: 'FERME' })).toContain('statut');
  });

  it('rejects a nom exceeding 300 characters', async () => {
    expect(await errorsFor(UpdateLivrableDto, { nom: 'Y'.repeat(301) })).toContain('nom');
  });

  it('rejects a code exceeding 20 characters', async () => {
    expect(await errorsFor(UpdateLivrableDto, { code: 'Z'.repeat(21) })).toContain('code');
  });

  it('rejects an invalid datePrevue on update', async () => {
    expect(await errorsFor(UpdateLivrableDto, { datePrevue: 'bad' })).toContain('datePrevue');
  });

  it('rejects an invalid dateSoumission on update', async () => {
    expect(await errorsFor(UpdateLivrableDto, { dateSoumission: 'bad' })).toContain(
      'dateSoumission',
    );
  });

  it('accepts a valid dateSoumission', async () => {
    expect(await errorsFor(UpdateLivrableDto, { dateSoumission: '2026-07-01' })).not.toContain(
      'dateSoumission',
    );
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateLivrableDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

// ─── LivrableQueryDto ────────────────────────────────────────────────────────

describe('LivrableQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(LivrableQueryDto, {
        projectId: PROJECT_UUID,
        statut: LivrableStatus.EN_COURS,
        search: 'rapport',
      }),
    ).toEqual([]);
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(LivrableQueryDto, {})).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(LivrableQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(LivrableQueryDto, { statut: 'INVALIDE' })).toContain('statut');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(LivrableQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc', async () => {
    expect(await errorsFor(LivrableQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
  });

  it('accepts sortOrder desc', async () => {
    expect(await errorsFor(LivrableQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });

  it('accepts all valid LivrableStatus values in filter', async () => {
    for (const stat of Object.values(LivrableStatus)) {
      expect(await errorsFor(LivrableQueryDto, { statut: stat })).not.toContain('statut');
    }
  });
});
