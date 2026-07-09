import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FormatRapport, StatutRapport, TypeRapport } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateReportDto ─────────────────────────────────────────────────────────

describe('CreateReportDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    codeRapport: 'RPT-001',
    titre: 'Rapport mensuel — Janvier 2026',
    type: TypeRapport.MENSUEL,
    format: FormatRapport.PDF,
    periode: 'Janvier 2026',
    dateGeneration: '2026-01-31',
    version: '1.0',
    auteur: 'Amadou Diallo',
  };

  it('accepts a minimal valid payload', async () => {
    expect(await errorsFor(CreateReportDto, valid)).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    expect(
      await errorsFor(CreateReportDto, {
        ...valid,
        description: 'Description complète',
        statut: StatutRapport.GENERE,
        dateTelechargement: '2026-02-05',
        tailleKo: 3200,
        nbTelechargements: 10,
        commentaires: 'Commentaire libre',
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _p, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, projectId: 'not-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing codeRapport', async () => {
    const { codeRapport: _c, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('codeRapport');
  });

  it('rejects a codeRapport exceeding 20 characters', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, codeRapport: 'X'.repeat(21) })).toContain(
      'codeRapport',
    );
  });

  it('rejects a missing titre', async () => {
    const { titre: _t, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('titre');
  });

  it('rejects a titre exceeding 300 characters', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, titre: 'X'.repeat(301) })).toContain(
      'titre',
    );
  });

  it('accepts a titre of exactly 300 characters', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, titre: 'X'.repeat(300) })).not.toContain(
      'titre',
    );
  });

  it('rejects a missing type', async () => {
    const { type: _t, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('type');
  });

  it('rejects an invalid type value', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, type: 'INCONNU' })).toContain('type');
  });

  it('accepts all valid TypeRapport values', async () => {
    for (const t of Object.values(TypeRapport)) {
      expect(await errorsFor(CreateReportDto, { ...valid, type: t })).not.toContain('type');
    }
  });

  it('rejects a missing format', async () => {
    const { format: _f, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('format');
  });

  it('rejects an invalid format value', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, format: 'DOCX' })).toContain('format');
  });

  it('accepts all valid FormatRapport values', async () => {
    for (const f of Object.values(FormatRapport)) {
      expect(await errorsFor(CreateReportDto, { ...valid, format: f })).not.toContain('format');
    }
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, statut: 'INVALIDE' })).toContain('statut');
  });

  it('accepts all valid StatutRapport values', async () => {
    for (const s of Object.values(StatutRapport)) {
      expect(await errorsFor(CreateReportDto, { ...valid, statut: s })).not.toContain('statut');
    }
  });

  it('rejects a missing dateGeneration', async () => {
    const { dateGeneration: _d, ...rest } = valid;
    expect(await errorsFor(CreateReportDto, rest)).toContain('dateGeneration');
  });

  it('rejects an invalid dateGeneration (not ISO date)', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, dateGeneration: 'not-a-date' })).toContain(
      'dateGeneration',
    );
  });

  it('accepts a valid dateTelechargement', async () => {
    expect(
      await errorsFor(CreateReportDto, { ...valid, dateTelechargement: '2026-02-01' }),
    ).not.toContain('dateTelechargement');
  });

  it('rejects a negative tailleKo', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, tailleKo: -1 })).toContain('tailleKo');
  });

  it('accepts tailleKo of 0', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, tailleKo: 0 })).not.toContain('tailleKo');
  });

  it('rejects a negative nbTelechargements', async () => {
    expect(await errorsFor(CreateReportDto, { ...valid, nbTelechargements: -5 })).toContain(
      'nbTelechargements',
    );
  });
});

// ─── UpdateReportDto ─────────────────────────────────────────────────────────

describe('UpdateReportDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateReportDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateReportDto, { statut: StatutRapport.VALIDE })).toEqual([]);
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(UpdateReportDto, { statut: 'MAUVAIS' })).toContain('statut');
  });

  it('rejects an invalid type value', async () => {
    expect(await errorsFor(UpdateReportDto, { type: 'BAD_TYPE' })).toContain('type');
  });

  it('rejects an invalid format value', async () => {
    expect(await errorsFor(UpdateReportDto, { format: 'ZIP' })).toContain('format');
  });

  it('rejects a titre exceeding 300 characters', async () => {
    expect(await errorsFor(UpdateReportDto, { titre: 'T'.repeat(301) })).toContain('titre');
  });

  it('accepts a valid titre', async () => {
    expect(await errorsFor(UpdateReportDto, { titre: 'Nouveau titre' })).not.toContain('titre');
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateReportDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });

  it('rejects an invalid dateGeneration on update', async () => {
    expect(await errorsFor(UpdateReportDto, { dateGeneration: 'pas-une-date' })).toContain(
      'dateGeneration',
    );
  });

  it('rejects a negative tailleKo on update', async () => {
    expect(await errorsFor(UpdateReportDto, { tailleKo: -1 })).toContain('tailleKo');
  });
});

// ─── ReportQueryDto ──────────────────────────────────────────────────────────

describe('ReportQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(ReportQueryDto, {
        projectId: PROJECT_UUID,
        type: TypeRapport.TRIMESTRIEL,
        format: FormatRapport.EXCEL,
        statut: StatutRapport.VALIDE,
        search: 'amadou',
      }),
    ).toEqual([]);
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(ReportQueryDto, {})).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(ReportQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(ReportQueryDto, { type: 'INVALIDE' })).toContain('type');
  });

  it('rejects an invalid format filter', async () => {
    expect(await errorsFor(ReportQueryDto, { format: 'INVALIDE' })).toContain('format');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(ReportQueryDto, { statut: 'INVALIDE' })).toContain('statut');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(ReportQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc', async () => {
    expect(await errorsFor(ReportQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
  });

  it('accepts sortOrder desc', async () => {
    expect(await errorsFor(ReportQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });

  it('accepts all valid TypeRapport values in filter', async () => {
    for (const t of Object.values(TypeRapport)) {
      expect(await errorsFor(ReportQueryDto, { type: t })).not.toContain('type');
    }
  });

  it('accepts all valid StatutRapport values in filter', async () => {
    for (const s of Object.values(StatutRapport)) {
      expect(await errorsFor(ReportQueryDto, { statut: s })).not.toContain('statut');
    }
  });
});
