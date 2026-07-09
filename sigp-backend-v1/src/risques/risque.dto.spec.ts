import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RiskImpact, RiskProbability, RiskStatus } from '@prisma/client';
import { CreateRisqueDto } from './dto/create-risque.dto';
import { UpdateRisqueDto } from './dto/update-risque.dto';
import { RisqueQueryDto } from './dto/risque-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── CreateRisqueDto ─────────────────────────────────────────────────────────

describe('CreateRisqueDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    description: 'Retard dans la livraison du matériel',
    probabilite: RiskProbability.POSSIBLE,
    impact: RiskImpact.IMPORTANT,
  };

  it('accepts a minimal valid payload', async () => {
    expect(await errorsFor(CreateRisqueDto, valid)).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    expect(
      await errorsFor(CreateRisqueDto, {
        ...valid,
        wbsId: PROJECT_UUID,
        code: 'RSK-001',
        categorie: 'Logistique',
        statut: RiskStatus.OUVERT,
        strategie: 'Mitigation des risques',
        planAction: 'Plan action',
        responsableId: PROJECT_UUID,
        dateDetection: '2026-03-01',
        dateEcheance: '2026-06-01',
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _p, ...rest } = valid;
    expect(await errorsFor(CreateRisqueDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, projectId: 'not-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing description', async () => {
    const { description: _d, ...rest } = valid;
    expect(await errorsFor(CreateRisqueDto, rest)).toContain('description');
  });

  it('rejects a missing probabilite', async () => {
    const { probabilite: _p, ...rest } = valid;
    expect(await errorsFor(CreateRisqueDto, rest)).toContain('probabilite');
  });

  it('rejects an invalid probabilite value', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, probabilite: 'TRES_FAIBLE' })).toContain(
      'probabilite',
    );
  });

  it('rejects a missing impact', async () => {
    const { impact: _i, ...rest } = valid;
    expect(await errorsFor(CreateRisqueDto, rest)).toContain('impact');
  });

  it('rejects an invalid impact value', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, impact: 'MAJEUR' })).toContain('impact');
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, statut: 'INCONNU' })).toContain('statut');
  });

  it('rejects a code exceeding 20 characters', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, code: 'X'.repeat(21) })).toContain('code');
  });

  it('accepts a code of exactly 20 characters', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, code: 'X'.repeat(20) })).not.toContain(
      'code',
    );
  });

  it('rejects an invalid dateDetection', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, dateDetection: 'not-a-date' })).toContain(
      'dateDetection',
    );
  });

  it('rejects an invalid dateEcheance', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, dateEcheance: 'bad-date' })).toContain(
      'dateEcheance',
    );
  });

  it('rejects an invalid wbsId (not UUID)', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, wbsId: 'not-uuid' })).toContain('wbsId');
  });

  it('rejects an invalid responsableId (not UUID)', async () => {
    expect(await errorsFor(CreateRisqueDto, { ...valid, responsableId: 'not-uuid' })).toContain(
      'responsableId',
    );
  });

  it('accepts all valid RiskProbability values', async () => {
    for (const prob of Object.values(RiskProbability)) {
      expect(await errorsFor(CreateRisqueDto, { ...valid, probabilite: prob })).not.toContain(
        'probabilite',
      );
    }
  });

  it('accepts all valid RiskImpact values', async () => {
    for (const imp of Object.values(RiskImpact)) {
      expect(await errorsFor(CreateRisqueDto, { ...valid, impact: imp })).not.toContain('impact');
    }
  });

  it('accepts all valid RiskStatus values', async () => {
    for (const stat of Object.values(RiskStatus)) {
      expect(await errorsFor(CreateRisqueDto, { ...valid, statut: stat })).not.toContain('statut');
    }
  });
});

// ─── UpdateRisqueDto ─────────────────────────────────────────────────────────

describe('UpdateRisqueDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateRisqueDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateRisqueDto, { statut: RiskStatus.EN_COURS })).toEqual([]);
  });

  it('rejects an invalid statut value', async () => {
    expect(await errorsFor(UpdateRisqueDto, { statut: 'ARCHIVE' })).toContain('statut');
  });

  it('rejects an invalid probabilite on update', async () => {
    expect(await errorsFor(UpdateRisqueDto, { probabilite: 'HIGH' })).toContain('probabilite');
  });

  it('accepts a valid probabilite on update', async () => {
    expect(await errorsFor(UpdateRisqueDto, { probabilite: RiskProbability.PROBABLE })).toEqual([]);
  });

  it('rejects a code exceeding 20 characters', async () => {
    expect(await errorsFor(UpdateRisqueDto, { code: 'Z'.repeat(21) })).toContain('code');
  });

  it('rejects an invalid dateDetection on update', async () => {
    expect(await errorsFor(UpdateRisqueDto, { dateDetection: 'bad' })).toContain('dateDetection');
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateRisqueDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

// ─── RisqueQueryDto ──────────────────────────────────────────────────────────

describe('RisqueQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(RisqueQueryDto, {
        projectId: PROJECT_UUID,
        statut: RiskStatus.OUVERT,
        probabilite: RiskProbability.POSSIBLE,
        impact: RiskImpact.IMPORTANT,
        search: 'livraison',
      }),
    ).toEqual([]);
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(RisqueQueryDto, {})).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(RisqueQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(RisqueQueryDto, { statut: 'INVALIDE' })).toContain('statut');
  });

  it('rejects an invalid probabilite filter', async () => {
    expect(await errorsFor(RisqueQueryDto, { probabilite: 'TRES_FORT' })).toContain('probabilite');
  });

  it('rejects an invalid impact filter', async () => {
    expect(await errorsFor(RisqueQueryDto, { impact: 'MEGA' })).toContain('impact');
  });

  it('rejects an invalid sortOrder', async () => {
    expect(await errorsFor(RisqueQueryDto, { sortOrder: 'random' })).toContain('sortOrder');
  });

  it('accepts sortOrder asc', async () => {
    expect(await errorsFor(RisqueQueryDto, { sortOrder: 'asc' })).not.toContain('sortOrder');
  });

  it('accepts sortOrder desc', async () => {
    expect(await errorsFor(RisqueQueryDto, { sortOrder: 'desc' })).not.toContain('sortOrder');
  });
});
