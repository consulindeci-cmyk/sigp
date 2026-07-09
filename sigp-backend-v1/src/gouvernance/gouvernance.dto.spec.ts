import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGouvernanceDto } from './dto/create-gouvernance.dto';
import { UpdateGouvernanceDto } from './dto/update-gouvernance.dto';
import { GouvernanceQueryDto } from './dto/gouvernance-query.dto';

const PROJ_UUID = 'a1b2c3d4-0000-4000-8000-ef1234567890';
const USER_UUID = 'b2c3d4e5-0000-4000-8000-ef1234567890';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateGouvernanceDto validation', () => {
  const valid = {
    projectId: PROJ_UUID,
    nom: 'Awa Koné',
    role: 'Président du comité',
    organisation: 'Ministère',
    email: 'awa.kone@sante.gouv',
    telephone: '+2250102030405',
    userId: USER_UUID,
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateGouvernanceDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (projectId + nom + role)', async () => {
    expect(
      await errorsFor(CreateGouvernanceDto, { projectId: PROJ_UUID, nom: 'Awa', role: 'Membre' }),
    ).toEqual([]);
  });

  it('rejects a missing projectId', async () => {
    expect(await errorsFor(CreateGouvernanceDto, { nom: 'Awa', role: 'Membre' })).toContain(
      'projectId',
    );
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateGouvernanceDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('rejects a missing role', async () => {
    expect(await errorsFor(CreateGouvernanceDto, { ...valid, role: '' })).toContain('role');
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor(CreateGouvernanceDto, { ...valid, email: 'not-an-email' })).toContain(
      'email',
    );
  });

  it('rejects an invalid userId', async () => {
    expect(await errorsFor(CreateGouvernanceDto, { ...valid, userId: 'nope' })).toContain('userId');
  });

  it('normalises the email (trim + lowercase) and trims nom/role', () => {
    const instance = plainToInstance(CreateGouvernanceDto, {
      ...valid,
      email: '  Awa.KONE@sante.gouv ',
      nom: '  Awa Koné  ',
      role: '  Président  ',
    });
    expect(instance.email).toBe('awa.kone@sante.gouv');
    expect(instance.nom).toBe('Awa Koné');
    expect(instance.role).toBe('Président');
  });
});

describe('UpdateGouvernanceDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateGouvernanceDto, {})).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor(UpdateGouvernanceDto, { email: 'bad' })).toContain('email');
  });

  it('does not declare projectId as a mutable property', () => {
    const declared = Object.keys(new UpdateGouvernanceDto() as Record<string, unknown>);
    expect(declared).not.toContain('projectId');
  });
});

describe('GouvernanceQueryDto validation', () => {
  it('accepts valid projectId and userId filters', async () => {
    expect(
      await errorsFor(GouvernanceQueryDto, { projectId: PROJ_UUID, userId: USER_UUID }),
    ).toEqual([]);
  });

  it('rejects an invalid projectId filter', async () => {
    expect(await errorsFor(GouvernanceQueryDto, { projectId: 'nope' })).toContain('projectId');
  });

  it('rejects an invalid userId filter', async () => {
    expect(await errorsFor(GouvernanceQueryDto, { userId: 'nope' })).toContain('userId');
  });
});
