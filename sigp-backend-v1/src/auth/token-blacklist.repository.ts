import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/shared/redis.provider';

/**
 * Repository de blacklist des Access Tokens JWT (Phase 1.4).
 *
 * S'appuie sur le singleton Redis existant. Un JWT n'est jamais supprimé :
 * il est marqué révoqué via une clé `jwt:blacklist:{jti}` dont le TTL correspond
 * exactement à la durée de vie restante du token. La clé expire donc d'elle-même
 * au moment où le JWT devient de toute façon invalide (exp naturel).
 */
@Injectable()
export class TokenBlacklistRepository {
  private static readonly KEY_PREFIX = 'jwt:blacklist:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private static key(jti: string): string {
    return `${TokenBlacklistRepository.KEY_PREFIX}${jti}`;
  }

  /**
   * Blackliste un JWT jusqu'à son expiration naturelle.
   * @param jti identifiant unique du token
   * @param ttlSeconds durée de vie restante du JWT, en secondes (jamais fixe)
   */
  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return; // token déjà expiré : rien à blacklister
    await this.redis.set(TokenBlacklistRepository.key(jti), '1', 'EX', ttlSeconds);
  }

  /** Retourne true si le jti est présent dans la blacklist Redis. */
  async isBlacklisted(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(TokenBlacklistRepository.key(jti));
    return exists === 1;
  }
}
