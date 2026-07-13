import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuditAction } from '@prisma/client';
import { HistoryQueryDto } from './dto/history-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const USER_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('HistoryQueryDto validation', () => {
  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(HistoryQueryDto, {})).toEqual([]);
  });

  it('accepts a fully populated valid query', async () => {
    expect(
      await errorsFor(HistoryQueryDto, {
        projectId: PROJECT_UUID,
        userId: USER_UUID,
        action: AuditAction.CREATE,
        module: 'contracts',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        search: 'diallo',
        sortBy: 'created_at',
        sortOrder: 'desc',
      }),
    ).toEqual([]);
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(HistoryQueryDto, { projectId: 'not-uuid' })).toContain('projectId');
  });

  it('rejects an invalid userId (not UUID)', async () => {
    expect(await errorsFor(HistoryQueryDto, { userId: 'not-uuid' })).toContain('userId');
  });

  it('rejects an invalid action value', async () => {
    expect(await errorsFor(HistoryQueryDto, { action: 'INVALID' })).toContain('action');
  });

  it('accepts all valid AuditAction values', async () => {
    for (const a of Object.values(AuditAction)) {
      expect(await errorsFor(HistoryQueryDto, { action: a })).not.toContain('action');
    }
  });

  it('rejects an invalid dateFrom (not ISO date)', async () => {
    expect(await errorsFor(HistoryQueryDto, { dateFrom: 'not-a-date' })).toContain('dateFrom');
  });

  it('rejects an invalid dateTo (not ISO date)', async () => {
    expect(await errorsFor(HistoryQueryDto, { dateTo: 'not-a-date' })).toContain('dateTo');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(HistoryQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc and desc', async () => {
    expect(await errorsFor(HistoryQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
    expect(await errorsFor(HistoryQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });
});
