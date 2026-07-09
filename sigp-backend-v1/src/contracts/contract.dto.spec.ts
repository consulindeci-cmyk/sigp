import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContractStatus, ContractType } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractQueryDto } from './dto/contract-query.dto';

const PROJECT_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const SOURCE_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';
const MARCHE_UUID = 'c3d4e5f6-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateContractDto validation', () => {
  const valid = {
    projectId: PROJECT_UUID,
    marcheId: MARCHE_UUID,
    fundingSourceId: SOURCE_UUID,
    numero: 'CTR-2026-001',
    intitule: 'Contrat de fourniture de matériel',
    type: ContractType.MARCHE,
    statut: ContractStatus.ACTIF,
    titulaire: 'Entreprise Alpha',
    montant: 10000000,
    devise: 'XOF',
    dateSignature: '2026-01-15',
    dateDebut: '2026-02-01',
    dateFin: '2026-12-31',
    notes: 'Notes du contrat',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateContractDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId, numero, intitule, titulaire, montant)', async () => {
    expect(
      await errorsFor(CreateContractDto, {
        projectId: PROJECT_UUID,
        numero: 'CTR-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
      }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    const { projectId: _projectId, ...rest } = valid;
    expect(await errorsFor(CreateContractDto, rest)).toContain('projectId');
  });

  it('rejects an invalid projectId UUID', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, projectId: 'not-a-uuid' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing numero', async () => {
    const { numero: _numero, ...rest } = valid;
    expect(await errorsFor(CreateContractDto, rest)).toContain('numero');
  });

  it('rejects a missing intitule', async () => {
    const { intitule: _intitule, ...rest } = valid;
    expect(await errorsFor(CreateContractDto, rest)).toContain('intitule');
  });

  it('rejects a missing titulaire', async () => {
    const { titulaire: _titulaire, ...rest } = valid;
    expect(await errorsFor(CreateContractDto, rest)).toContain('titulaire');
  });

  it('rejects a missing montant', async () => {
    const { montant: _montant, ...rest } = valid;
    expect(await errorsFor(CreateContractDto, rest)).toContain('montant');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, montant: -1 })).toContain('montant');
  });

  it('rejects an invalid marcheId UUID', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, marcheId: 'not-a-uuid' })).toContain(
      'marcheId',
    );
  });

  it('rejects an invalid fundingSourceId UUID', async () => {
    expect(
      await errorsFor(CreateContractDto, { ...valid, fundingSourceId: 'not-a-uuid' }),
    ).toContain('fundingSourceId');
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, type: 'NOPE' })).toContain('type');
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, statut: 'NOPE' })).toContain('statut');
  });

  it('accepts all four ContractType values', async () => {
    for (const type of [
      ContractType.MARCHE,
      ContractType.CONVENTION,
      ContractType.PROTOCOLE,
      ContractType.LETTRE_ACCORD,
    ]) {
      expect(await errorsFor(CreateContractDto, { ...valid, type })).toEqual([]);
    }
  });

  it('accepts all four ContractStatus values', async () => {
    for (const statut of [
      ContractStatus.ACTIF,
      ContractStatus.SUSPENDU,
      ContractStatus.CLOTURE,
      ContractStatus.RESILIE,
    ]) {
      expect(await errorsFor(CreateContractDto, { ...valid, statut })).toEqual([]);
    }
  });

  it('rejects an invalid dateSignature', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, dateSignature: 'not-a-date' })).toContain(
      'dateSignature',
    );
  });

  it('rejects an invalid dateDebut', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, dateDebut: 'not-a-date' })).toContain(
      'dateDebut',
    );
  });

  it('rejects an invalid dateFin', async () => {
    expect(await errorsFor(CreateContractDto, { ...valid, dateFin: 'not-a-date' })).toContain(
      'dateFin',
    );
  });
});

describe('UpdateContractDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateContractDto, {})).toEqual([]);
  });

  it('accepts a valid statut change', async () => {
    expect(await errorsFor(UpdateContractDto, { statut: ContractStatus.CLOTURE })).toEqual([]);
  });

  it('rejects an invalid statut', async () => {
    expect(await errorsFor(UpdateContractDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('rejects a negative montant', async () => {
    expect(await errorsFor(UpdateContractDto, { montant: -100 })).toContain('montant');
  });

  it('rejects an invalid dateFin', async () => {
    expect(await errorsFor(UpdateContractDto, { dateFin: 'bad' })).toContain('dateFin');
  });

  it('rejects an invalid marcheId UUID', async () => {
    expect(await errorsFor(UpdateContractDto, { marcheId: 'nope' })).toContain('marcheId');
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateContractDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });

  it('does not declare fundingSourceId as a mutable property', () => {
    const declared = Object.keys(new UpdateContractDto() as Record<string, unknown>);
    expect(declared).not.toContain('fundingSourceId');
  });
});

describe('ContractQueryDto validation', () => {
  it('accepts valid filters', async () => {
    expect(
      await errorsFor(ContractQueryDto, {
        projectId: PROJECT_UUID,
        type: ContractType.CONVENTION,
        statut: ContractStatus.ACTIF,
      }),
    ).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(ContractQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(ContractQueryDto, { type: 'NOPE' })).toContain('type');
  });

  it('rejects an invalid statut filter', async () => {
    expect(await errorsFor(ContractQueryDto, { statut: 'NOPE' })).toContain('statut');
  });

  it('accepts an empty query (all filters optional)', async () => {
    expect(await errorsFor(ContractQueryDto, {})).toEqual([]);
  });
});
