import { Injectable } from '@nestjs/common';
import { RefreshToken, User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

/** Sentinelle lancée à l'intérieur de la transaction lors d'une rotation concurrente. */
export const CONCURRENT_ROTATION_ERROR = 'TOKEN_ALREADY_ROTATED';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── User ────────────────────────────────────────────────────────────────────

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deleted_at: null },
    });
  }

  findUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { derniere_connexion: new Date() },
    });
  }

  // ─── Refresh Tokens ──────────────────────────────────────────────────────────

  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        user_id: data.userId,
        token_hash: data.tokenHash,
        family_id: data.familyId,
        expires_at: data.expiresAt,
      },
    });
  }

  /**
   * Lookup déterministe par SHA-256 du token opaque.
   * Retourne le record qu'il soit actif ou révoqué (nécessaire pour la reuse detection).
   */
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });
  }

  /**
   * Rotation atomique : invalide l'ancien token et crée le nouveau dans une seule transaction.
   * Un guard de concurrence re-vérifie à l'intérieur de la transaction que le token n'a pas
   * déjà été révoqué par une requête parallèle.
   *
   * @throws Error(CONCURRENT_ROTATION_ERROR) si le token a déjà été révoqué concurrentiellement.
   */
  async rotateInTransaction(oldTokenId: string, newData: CreateRefreshTokenData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Guard de concurrence : re-vérifie que le token est toujours actif
      const current = await tx.refreshToken.findFirst({
        where: { id: oldTokenId, revoked_at: null },
        select: { id: true },
      });

      if (!current) {
        throw new Error(CONCURRENT_ROTATION_ERROR);
      }

      // Invalider l'ancien token
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: { revoked_at: new Date() },
      });

      // Créer le nouveau token (même famille, nouveau hash)
      await tx.refreshToken.create({
        data: {
          user_id: newData.userId,
          token_hash: newData.tokenHash,
          family_id: newData.familyId,
          expires_at: newData.expiresAt,
        },
      });
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family_id: familyId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
