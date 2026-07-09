import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TypeNotification } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

const USER_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const PROJECT_UUID = 'b1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateNotificationDto ───────────────────────────────────────────────────

describe('CreateNotificationDto validation', () => {
  const valid = {
    userId: USER_UUID,
    type: TypeNotification.RISQUE_CRITIQUE,
    titre: 'Risque critique détecté',
    message: 'Un risque critique a été détecté sur le projet.',
  };

  it('accepts a minimal valid payload', async () => {
    expect(await errorsFor(CreateNotificationDto, valid)).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    expect(
      await errorsFor(CreateNotificationDto, {
        ...valid,
        projectId: PROJECT_UUID,
        lue: false,
        data: { key: 'value' },
        expiresAt: '2026-12-31T23:59:59Z',
      }),
    ).toEqual([]);
  });

  it('rejects a missing userId', async () => {
    const { userId: _u, ...rest } = valid;
    expect(await errorsFor(CreateNotificationDto, rest)).toContain('userId');
  });

  it('rejects an invalid userId (not UUID)', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, userId: 'not-uuid' })).toContain(
      'userId',
    );
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, projectId: 'nope' })).toContain(
      'projectId',
    );
  });

  it('accepts a valid projectId', async () => {
    expect(
      await errorsFor(CreateNotificationDto, { ...valid, projectId: PROJECT_UUID }),
    ).not.toContain('projectId');
  });

  it('rejects a missing type', async () => {
    const { type: _t, ...rest } = valid;
    expect(await errorsFor(CreateNotificationDto, rest)).toContain('type');
  });

  it('rejects an invalid type value', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, type: 'INVALIDE' })).toContain(
      'type',
    );
  });

  it('accepts all valid TypeNotification values', async () => {
    for (const t of Object.values(TypeNotification)) {
      expect(await errorsFor(CreateNotificationDto, { ...valid, type: t })).not.toContain('type');
    }
  });

  it('rejects a missing titre', async () => {
    const { titre: _t, ...rest } = valid;
    expect(await errorsFor(CreateNotificationDto, rest)).toContain('titre');
  });

  it('rejects a titre exceeding 200 characters', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, titre: 'X'.repeat(201) })).toContain(
      'titre',
    );
  });

  it('accepts a titre of exactly 200 characters', async () => {
    expect(
      await errorsFor(CreateNotificationDto, { ...valid, titre: 'X'.repeat(200) }),
    ).not.toContain('titre');
  });

  it('rejects a missing message', async () => {
    const { message: _m, ...rest } = valid;
    expect(await errorsFor(CreateNotificationDto, rest)).toContain('message');
  });

  it('rejects an invalid expiresAt (not ISO date)', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, expiresAt: 'not-a-date' })).toContain(
      'expiresAt',
    );
  });

  it('accepts a valid expiresAt ISO date', async () => {
    expect(
      await errorsFor(CreateNotificationDto, { ...valid, expiresAt: '2026-12-31' }),
    ).not.toContain('expiresAt');
  });

  it('rejects a non-boolean lue value', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, lue: 'yes' })).toContain('lue');
  });

  it('accepts lue: true', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, lue: true })).not.toContain('lue');
  });

  it('rejects a non-object data value', async () => {
    expect(await errorsFor(CreateNotificationDto, { ...valid, data: 'string' })).toContain('data');
  });

  it('accepts a valid data object', async () => {
    expect(
      await errorsFor(CreateNotificationDto, { ...valid, data: { riskId: 'abc' } }),
    ).not.toContain('data');
  });
});

// ─── UpdateNotificationDto ───────────────────────────────────────────────────

describe('UpdateNotificationDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateNotificationDto, {})).toEqual([]);
  });

  it('accepts lue: true (mark as read)', async () => {
    expect(await errorsFor(UpdateNotificationDto, { lue: true })).toEqual([]);
  });

  it('rejects an invalid type value', async () => {
    expect(await errorsFor(UpdateNotificationDto, { type: 'BAD' })).toContain('type');
  });

  it('rejects a titre exceeding 200 characters', async () => {
    expect(await errorsFor(UpdateNotificationDto, { titre: 'T'.repeat(201) })).toContain('titre');
  });

  it('accepts a valid titre', async () => {
    expect(await errorsFor(UpdateNotificationDto, { titre: 'Nouveau titre' })).not.toContain(
      'titre',
    );
  });

  it('rejects an invalid expiresAt on update', async () => {
    expect(await errorsFor(UpdateNotificationDto, { expiresAt: 'pas-une-date' })).toContain(
      'expiresAt',
    );
  });

  it('does not declare userId as a mutable property', () => {
    const declared = Object.keys(new UpdateNotificationDto() as Record<string, unknown>);
    expect(declared).not.toContain('userId');
  });

  it('rejects a non-boolean lue', async () => {
    expect(await errorsFor(UpdateNotificationDto, { lue: 'true' })).toContain('lue');
  });
});

// ─── NotificationQueryDto ────────────────────────────────────────────────────

describe('NotificationQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(NotificationQueryDto, {
        userId: USER_UUID,
        projectId: PROJECT_UUID,
        type: TypeNotification.BUDGET_DEPASSE,
        search: 'critique',
      }),
    ).toEqual([]);
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(NotificationQueryDto, {})).toEqual([]);
  });

  it('rejects an invalid userId filter', async () => {
    expect(await errorsFor(NotificationQueryDto, { userId: 'nope' })).toContain('userId');
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(NotificationQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(NotificationQueryDto, { type: 'INVALIDE' })).toContain('type');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(NotificationQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc', async () => {
    expect(await errorsFor(NotificationQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
  });

  it('accepts sortOrder desc', async () => {
    expect(await errorsFor(NotificationQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });

  it('accepts all valid TypeNotification values in filter', async () => {
    for (const t of Object.values(TypeNotification)) {
      expect(await errorsFor(NotificationQueryDto, { type: t })).not.toContain('type');
    }
  });
});
