import type Redis from 'ioredis';
import { TokenBlacklistRepository } from './token-blacklist.repository';

describe('TokenBlacklistRepository', () => {
  let repo: TokenBlacklistRepository;
  let redis: { set: jest.Mock; exists: jest.Mock };

  beforeEach(() => {
    redis = { set: jest.fn().mockResolvedValue('OK'), exists: jest.fn() };
    repo = new TokenBlacklistRepository(redis as unknown as Redis);
  });

  afterEach(() => jest.clearAllMocks());

  describe('blacklist()', () => {
    it('stores the jti under the jwt:blacklist prefix with an EX TTL = remaining lifetime', async () => {
      await repo.blacklist('jti-123', 850);

      // TTL dynamique : jamais une durée fixe, exactement le temps restant fourni
      expect(redis.set).toHaveBeenCalledWith('jwt:blacklist:jti-123', '1', 'EX', 850);
    });

    it('does not write to Redis when the TTL is zero (token already expired)', async () => {
      await repo.blacklist('jti-expired', 0);
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('does not write to Redis when the TTL is negative (token already expired)', async () => {
      await repo.blacklist('jti-expired', -5);
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('isBlacklisted()', () => {
    it('returns true when the key exists in Redis', async () => {
      redis.exists.mockResolvedValue(1);

      await expect(repo.isBlacklisted('jti-123')).resolves.toBe(true);
      expect(redis.exists).toHaveBeenCalledWith('jwt:blacklist:jti-123');
    });

    it('returns false when the key does not exist', async () => {
      redis.exists.mockResolvedValue(0);

      await expect(repo.isBlacklisted('jti-404')).resolves.toBe(false);
    });
  });
});
