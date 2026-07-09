import * as fs from 'fs';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

// Hoisted by Jest — appliqué avant l'import de JwtStrategy
jest.mock('fs', () => ({
  ...jest.requireActual<typeof fs>('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockConfig = {
  get: (key: string, defaultVal?: unknown) => {
    const cfg: Record<string, unknown> = { JWT_PUBLIC_KEY_PATH: './keys/public.pem' };
    return cfg[key] ?? defaultVal;
  },
} as unknown as ConfigService;

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    // passport-jwt stocke la clé ; ne la parse pas dans le constructeur
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('mock-rsa-public-key'));
    strategy = new JwtStrategy(mockConfig);
  });

  afterEach(() => jest.clearAllMocks());

  describe('constructor', () => {
    it('throws a FATAL error when the RSA public key file is absent', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(() => new JwtStrategy(mockConfig)).toThrow(/JWT RSA public key not found/);
    });
  });

  describe('validate()', () => {
    it('returns an AuthenticatedUser for a valid payload', () => {
      const result = strategy.validate({
        sub: 'a1b2c3d4-0000-0000-0000-ef1234567890',
        email: 'admin@sigp.local',
        role: UserRole.ADMIN,
      });

      expect(result).toEqual({
        id: 'a1b2c3d4-0000-0000-0000-ef1234567890',
        email: 'admin@sigp.local',
        role: UserRole.ADMIN,
      });
    });

    it.each([
      [{ sub: '', email: 'user@sigp.local', role: UserRole.COORDINATEUR }],
      [{ sub: 'uuid', email: '', role: UserRole.FINANCIER }],
      [{ sub: 'uuid', email: 'user@sigp.local', role: '' as UserRole }],
    ])('throws UnauthorizedException for an incomplete payload (%j)', (payload) => {
      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });
  });
});
