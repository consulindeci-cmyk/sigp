import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GlobalSearchQueryDto, SearchModuleFilter } from './dto/global-search-query.dto';
import { GlobalSearchItemDto } from './dto/global-search-item.dto';
import { GlobalSearchResponseDto } from './dto/global-search-response.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── GlobalSearchQueryDto ─────────────────────────────────────────────────────

describe('GlobalSearchQueryDto validation', () => {
  it('accepts a valid query of 2+ characters', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: 'ab' })).toEqual([]);
  });

  it('accepts a long query string', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: 'formation des agents' })).toEqual([]);
  });

  it('rejects a query shorter than 2 characters', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: 'a' })).toContain('query');
  });

  it('rejects an empty query', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: '' })).toContain('query');
  });

  it('rejects a missing query', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, {})).toContain('query');
  });

  it('accepts a valid module filter', async () => {
    for (const mod of Object.values(SearchModuleFilter)) {
      expect(await errorsFor(GlobalSearchQueryDto, { query: 'test', module: mod })).toEqual([]);
    }
  });

  it('rejects an invalid module value', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: 'test', module: 'invalid' })).toContain(
      'module',
    );
  });

  it('accepts no module (optional)', async () => {
    expect(await errorsFor(GlobalSearchQueryDto, { query: 'test' })).toEqual([]);
  });

  it('SearchModuleFilter has 9 values', () => {
    expect(Object.values(SearchModuleFilter)).toHaveLength(9);
  });

  it('SearchModuleFilter contains expected module names', () => {
    const values = Object.values(SearchModuleFilter);
    expect(values).toContain('projects');
    expect(values).toContain('ptba');
    expect(values).toContain('budget');
    expect(values).toContain('risques');
    expect(values).toContain('ppm');
    expect(values).toContain('livrables');
    expect(values).toContain('documents');
    expect(values).toContain('reports');
    expect(values).toContain('notifications');
  });
});

// ─── GlobalSearchItemDto ──────────────────────────────────────────────────────

describe('GlobalSearchItemDto', () => {
  it('accepts a fully populated item', () => {
    const item: GlobalSearchItemDto = {
      id: 'a1b2c3d4-0000-4000-8000-ef1234567890',
      module: 'projects',
      title: 'Projet santé rurale',
      subtitle: 'PRJ-2026-001',
      status: 'EN_COURS',
      url: '/api/v1/projects/a1b2c3d4',
      projectId: 'a1b2c3d4-0000-4000-8000-ef1234567890',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    expect(item.id).toBe('a1b2c3d4-0000-4000-8000-ef1234567890');
    expect(item.module).toBe('projects');
    expect(item.title).toBe('Projet santé rurale');
    expect(item.subtitle).toBe('PRJ-2026-001');
    expect(item.status).toBe('EN_COURS');
    expect(item.url).toBe('/api/v1/projects/a1b2c3d4');
    expect(item.projectId).toBe('a1b2c3d4-0000-4000-8000-ef1234567890');
  });

  it('accepts null subtitle, status, and projectId', () => {
    const item: GlobalSearchItemDto = {
      id: 'id-1',
      module: 'budget',
      title: 'Ligne budgétaire',
      subtitle: null,
      status: null,
      url: '/api/v1/budget-lines/id-1',
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(item.subtitle).toBeNull();
    expect(item.status).toBeNull();
    expect(item.projectId).toBeNull();
  });
});

// ─── GlobalSearchResponseDto ──────────────────────────────────────────────────

describe('GlobalSearchResponseDto', () => {
  it('holds items, total, and query', () => {
    const dto: GlobalSearchResponseDto = {
      items: [],
      total: 0,
      query: 'test',
    };

    expect(dto.items).toHaveLength(0);
    expect(dto.total).toBe(0);
    expect(dto.query).toBe('test');
  });

  it('total reflects the number of items', () => {
    const item: GlobalSearchItemDto = {
      id: 'i-1',
      module: 'projects',
      title: 'Projet A',
      subtitle: null,
      status: null,
      url: '/api/v1/projects/i-1',
      projectId: 'i-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dto: GlobalSearchResponseDto = { items: [item], total: 1, query: 'projet' };
    expect(dto.items).toHaveLength(1);
    expect(dto.total).toBe(1);
  });
});
