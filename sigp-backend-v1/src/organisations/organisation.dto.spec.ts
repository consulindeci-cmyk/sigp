import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrganisationType } from '@prisma/client';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe('CreateOrganisationDto validation', () => {
  const valid = {
    code: 'MIN-SANTE',
    nom: 'Ministère de la Santé',
    type: OrganisationType.MINISTERE,
    email: 'contact@sante.gouv',
    telephone: '+2250102030405',
    siteWeb: 'https://sante.gouv',
    description: 'Institution publique',
  };

  it('accepts a fully valid payload', async () => {
    expect(await errorsFor(CreateOrganisationDto, valid)).toEqual([]);
  });

  it('accepts a minimal payload (code + nom only)', async () => {
    expect(await errorsFor(CreateOrganisationDto, { code: 'X', nom: 'X Org' })).toEqual([]);
  });

  it('rejects a missing code', async () => {
    expect(await errorsFor(CreateOrganisationDto, { ...valid, code: '' })).toContain('code');
  });

  it('rejects a missing nom', async () => {
    expect(await errorsFor(CreateOrganisationDto, { ...valid, nom: '' })).toContain('nom');
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor(CreateOrganisationDto, { ...valid, email: 'not-an-email' })).toContain(
      'email',
    );
  });

  it('rejects an invalid siteWeb URL', async () => {
    expect(await errorsFor(CreateOrganisationDto, { ...valid, siteWeb: 'not a url' })).toContain(
      'siteWeb',
    );
  });

  it('rejects an invalid type', async () => {
    expect(await errorsFor(CreateOrganisationDto, { ...valid, type: 'PRIVE' })).toContain('type');
  });

  it('normalises the code (trim + uppercase)', () => {
    const instance = plainToInstance(CreateOrganisationDto, { ...valid, code: '  min-sante ' });
    expect(instance.code).toBe('MIN-SANTE');
  });

  it('normalises the email (trim + lowercase) and trims the nom', () => {
    const instance = plainToInstance(CreateOrganisationDto, {
      ...valid,
      email: '  Contact@SANTE.gouv ',
      nom: '  Ministère  ',
    });
    expect(instance.email).toBe('contact@sante.gouv');
    expect(instance.nom).toBe('Ministère');
  });
});

describe('UpdateOrganisationDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await errorsFor(UpdateOrganisationDto, {})).toEqual([]);
  });

  it('accepts a boolean actif', async () => {
    expect(await errorsFor(UpdateOrganisationDto, { actif: false })).toEqual([]);
  });

  it('rejects a non-boolean actif', async () => {
    expect(await errorsFor(UpdateOrganisationDto, { actif: 'yes' })).toContain('actif');
  });

  it('exposes only the mutable fields (code is not a declared property)', () => {
    // Le pipe global (whitelist) rejette `code` en requête ; au niveau type,
    // UpdateOrganisationDto ne déclare aucune propriété `code`.
    const declared = Object.keys(new UpdateOrganisationDto() as Record<string, unknown>);
    expect(declared).not.toContain('code');
    const instance = plainToInstance(UpdateOrganisationDto, { nom: 'X', actif: true });
    expect(instance.nom).toBe('X');
    expect(instance.actif).toBe(true);
  });
});

describe('OrganisationQueryDto validation', () => {
  it('transforms actif="true" (query string) into a boolean', () => {
    const instance = plainToInstance(OrganisationQueryDto, { actif: 'true' });
    expect(instance.actif).toBe(true);
  });

  it('transforms actif="false" (query string) into a boolean', () => {
    const instance = plainToInstance(OrganisationQueryDto, { actif: 'false' });
    expect(instance.actif).toBe(false);
  });

  it('leaves actif undefined when absent', async () => {
    const instance = plainToInstance(OrganisationQueryDto, { page: 1 });
    expect(instance.actif).toBeUndefined();
    expect(await validate(instance)).toEqual([]);
  });

  it('rejects an invalid type filter', async () => {
    expect(await errorsFor(OrganisationQueryDto, { type: 'PRIVE' })).toContain('type');
  });
});
