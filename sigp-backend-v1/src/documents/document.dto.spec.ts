import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DocumentStatus } from '@prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const LIVRABLE_UUID = 'b1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateDocumentDto ───────────────────────────────────────────────────────

describe('CreateDocumentDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    titre: 'Rapport de démarrage',
  };

  it('accepts a minimal valid payload', async () => {
    expect(await errorsFor(CreateDocumentDto, valid)).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    expect(
      await errorsFor(CreateDocumentDto, {
        ...valid,
        livrableId: LIVRABLE_UUID,
        description: 'Description détaillée',
        statut: DocumentStatus.BROUILLON,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _p, ...rest } = valid;
    expect(await errorsFor(CreateDocumentDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(CreateDocumentDto, { ...valid, projectId: 'not-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing titre', async () => {
    const { titre: _t, ...rest } = valid;
    expect(await errorsFor(CreateDocumentDto, rest)).toContain('titre');
  });

  it('rejects a titre exceeding 300 characters', async () => {
    expect(await errorsFor(CreateDocumentDto, { ...valid, titre: 'X'.repeat(301) })).toContain(
      'titre',
    );
  });

  it('accepts a titre of exactly 300 characters', async () => {
    expect(await errorsFor(CreateDocumentDto, { ...valid, titre: 'X'.repeat(300) })).not.toContain(
      'titre',
    );
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(CreateDocumentDto, { ...valid, statut: 'INCONNU' })).toContain('statut');
  });

  it('accepts all valid DocumentStatus values', async () => {
    for (const stat of Object.values(DocumentStatus)) {
      expect(await errorsFor(CreateDocumentDto, { ...valid, statut: stat })).not.toContain(
        'statut',
      );
    }
  });

  it('rejects an invalid livrableId (not UUID)', async () => {
    expect(await errorsFor(CreateDocumentDto, { ...valid, livrableId: 'not-uuid' })).toContain(
      'livrableId',
    );
  });

  it('accepts a valid livrableId', async () => {
    expect(
      await errorsFor(CreateDocumentDto, { ...valid, livrableId: LIVRABLE_UUID }),
    ).not.toContain('livrableId');
  });
});

// ─── UpdateDocumentDto ───────────────────────────────────────────────────────

describe('UpdateDocumentDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateDocumentDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateDocumentDto, { statut: DocumentStatus.SOUMIS })).toEqual([]);
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(UpdateDocumentDto, { statut: 'ARCHIVE_OLD' })).toContain('statut');
  });

  it('rejects a titre exceeding 300 characters', async () => {
    expect(await errorsFor(UpdateDocumentDto, { titre: 'T'.repeat(301) })).toContain('titre');
  });

  it('accepts a valid titre', async () => {
    expect(await errorsFor(UpdateDocumentDto, { titre: 'Nouveau titre' })).not.toContain('titre');
  });

  it('rejects an invalid livrableId on update', async () => {
    expect(await errorsFor(UpdateDocumentDto, { livrableId: 'nope' })).toContain('livrableId');
  });

  it('accepts a valid livrableId on update', async () => {
    expect(await errorsFor(UpdateDocumentDto, { livrableId: LIVRABLE_UUID })).not.toContain(
      'livrableId',
    );
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateDocumentDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

// ─── DocumentQueryDto ────────────────────────────────────────────────────────

describe('DocumentQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(DocumentQueryDto, {
        projectId: PROJECT_UUID,
        livrableId: LIVRABLE_UUID,
        statut: DocumentStatus.VALIDE,
        search: 'rapport',
      }),
    ).toEqual([]);
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(DocumentQueryDto, {})).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(DocumentQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid livrableId filter', async () => {
    expect(await errorsFor(DocumentQueryDto, { livrableId: 'nope' })).toContain('livrableId');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(DocumentQueryDto, { statut: 'INVALIDE' })).toContain('statut');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(DocumentQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc', async () => {
    expect(await errorsFor(DocumentQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
  });

  it('accepts sortOrder desc', async () => {
    expect(await errorsFor(DocumentQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });

  it('accepts all valid DocumentStatus values in filter', async () => {
    for (const stat of Object.values(DocumentStatus)) {
      expect(await errorsFor(DocumentQueryDto, { statut: stat })).not.toContain('statut');
    }
  });
});
