import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateUserDto validation', () => {
  const valid = {
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@sigp.local',
    password: 'Str0ng@Pass',
    role: UserRole.VIEWER,
    telephone: '+2250102030405',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateUserDto, valid)).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor(CreateUserDto, { ...valid, email: 'not-an-email' })).toContain('email');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateUserDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('rejects a missing prenom', async () => {
    expect(await errorsFor(CreateUserDto, { ...valid, prenom: '' })).toContain('prenom');
  });

  it.each([
    ['too short', 'Ab1@'],
    ['no uppercase', 'str0ng@pass'],
    ['no lowercase', 'STR0NG@PASS'],
    ['no digit', 'Strong@Pass'],
    ['no special char', 'Str0ngPass1'],
  ])('rejects a weak password (%s)', async (_label, password) => {
    expect(await errorsFor(CreateUserDto, { ...valid, password })).toContain('password');
  });

  it('rejects an invalid role', async () => {
    expect(await errorsFor(CreateUserDto, { ...valid, role: 'SUPERADMIN' })).toContain('role');
  });

  it('allows telephone to be omitted (optional)', async () => {
    const withoutPhone = {
      nom: valid.nom,
      prenom: valid.prenom,
      email: valid.email,
      password: valid.password,
      role: valid.role,
    };
    expect(await errorsFor(CreateUserDto, withoutPhone)).toEqual([]);
  });

  it('normalises the email (trim + lowercase)', () => {
    const instance = plainToInstance(CreateUserDto, { ...valid, email: '  John.DOE@SIGP.local ' });
    expect(instance.email).toBe('john.doe@sigp.local');
  });
});

describe('UpdateUserDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateUserDto, {})).toEqual([]);
  });

  it('accepts a boolean actif (statut)', async () => {
    expect(await errorsFor(UpdateUserDto, { actif: false })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateUserDto, { actif: 'yes' })).toContain('actif');
  });

  it('rejects an invalid role', async () => {
    expect(await errorsFor(UpdateUserDto, { role: 'BOSS' })).toContain('role');
  });
});
