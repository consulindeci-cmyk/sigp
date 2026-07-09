import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ForbiddenException, UnauthorizedException } from '@/common/exceptions/business.exception';
import { AuthRepository, CONCURRENT_ROTATION_ERROR } from './auth.repository';
import { TokenBlacklistRepository } from './token-blacklist.repository';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthenticatedUser } from './interfaces/user-request.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/** Taille du token brut en octets → 128 caractères hex, 256 bits d'entropie. */
const RAW_TOKEN_BYTES = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenBlacklist: TokenBlacklistRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResponseDto> {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, 'Identifiants invalides');
    }

    if (!user.actif) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_DISABLED, 'Ce compte est désactivé');
    }

    const isPasswordValid = await argon2.verify(user.mot_de_passe, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, 'Identifiants invalides');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.config.get<number>('JWT_ACCESS_TOKEN_TTL', 900);

    const refreshToken = await this.generateRefreshToken(user.id);

    setImmediate(() => {
      void this.authRepository.updateLastLogin(user.id);
      void this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN,
        tableCible: 'users',
        enregistrementId: user.id,
        ipAddress: ip,
        userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.USER_LOGGED_IN, { userId: user.id, email: user.email });

    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: expiresIn ?? 900 };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(
    dto: RefreshTokenDto,
    ip?: string,
    userAgent?: string,
  ): Promise<RefreshResponseDto> {
    // SHA-256 déterministe : permet le lookup exact sans révéler le token en DB
    const sha256Hash = createHash('sha256').update(dto.refreshToken).digest('hex');

    const existingToken = await this.authRepository.findRefreshTokenByHash(sha256Hash);

    if (!existingToken) {
      throw new UnauthorizedException(
        ErrorCode.REFRESH_TOKEN_EXPIRED,
        'Refresh token invalide ou expiré',
      );
    }

    // Reuse detection : token trouvé mais déjà révoqué → tentative de vol
    if (existingToken.revoked_at !== null) {
      await this.revokeTokenFamily(existingToken.family_id, existingToken.user_id, 'reuse');
      throw new UnauthorizedException(
        ErrorCode.REFRESH_TOKEN_REUSE_DETECTED,
        'Réutilisation détectée — famille de tokens révoquée',
      );
    }

    if (existingToken.expires_at < new Date()) {
      throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_EXPIRED, 'Refresh token expiré');
    }

    const user = await this.authRepository.findUserById(existingToken.user_id);
    if (!user || !user.actif) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_DISABLED, 'Ce compte est désactivé');
    }

    // Préparer le nouveau token HORS transaction (I/O crypto ne doit pas bloquer le tx Prisma)
    const newRawToken = randomBytes(RAW_TOKEN_BYTES).toString('hex');
    const newTokenHash = createHash('sha256').update(newRawToken).digest('hex');
    const refreshTtl = this.config.get<number>('JWT_REFRESH_TOKEN_TTL', 604800) ?? 604800;
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    // Rotation atomique : revoke ancien + insert nouveau dans une seule transaction Prisma
    try {
      await this.authRepository.rotateInTransaction(existingToken.id, {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: existingToken.family_id,
        expiresAt,
      });
    } catch (error) {
      if ((error as Error).message === CONCURRENT_ROTATION_ERROR) {
        // Une requête parallèle a consommé ce token en premier
        throw new UnauthorizedException(
          ErrorCode.REFRESH_TOKEN_EXPIRED,
          'Token déjà utilisé par une requête concurrente',
        );
      }
      throw error;
    }

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };
    const newAccessToken = this.jwtService.sign(newPayload);
    const expiresIn = this.config.get<number>('JWT_ACCESS_TOKEN_TTL', 900) ?? 900;

    setImmediate(() => {
      void this.auditService.log({
        userId: user.id,
        action: AuditAction.UPDATE,
        tableCible: 'refresh_tokens',
        enregistrementId: existingToken.id,
        ipAddress: ip,
        userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.AUTH_REFRESH_SUCCESS, {
      userId: user.id,
      familyId: existingToken.family_id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  /**
   * Déconnexion sécurisée (Phase 1.4).
   *
   * - Révoque toute la Token Family du refresh token courant (empêche toute rotation).
   * - Blackliste l'Access Token courant dans Redis jusqu'à son expiration naturelle.
   *   Le JWT n'est jamais supprimé : il reste refusé par le guard jusqu'à son `exp`.
   *
   * Le refresh token courant est identifié par son hash SHA-256 (lookup déterministe).
   * L'Access Token est identifié par le `jti` porté par le JWT authentifié.
   */
  async logout(
    user: AuthenticatedUser,
    dto: LogoutDto,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    // 1. Révocation de la Token Family associée au refresh token courant
    const sha256Hash = createHash('sha256').update(dto.refreshToken).digest('hex');
    const existingToken = await this.authRepository.findRefreshTokenByHash(sha256Hash);

    if (existingToken) {
      await this.authRepository.revokeFamily(existingToken.family_id);

      setImmediate(() => {
        void this.auditService.log({
          userId: user.id,
          action: AuditAction.DELETE,
          tableCible: 'refresh_tokens',
          enregistrementId: existingToken.id,
          apres: { reason: 'logout', familyId: existingToken.family_id },
          ipAddress: ip,
          userAgent,
        });
      });

      this.eventEmitter.emit(AppEvent.AUTH_REFRESH_REVOKED, {
        userId: user.id,
        familyId: existingToken.family_id,
      });
    }

    // 2. Blacklist de l'Access Token courant jusqu'à son exp naturel (TTL dynamique)
    if (user.jti && user.exp) {
      const ttlSeconds = user.exp - Math.floor(Date.now() / 1000);
      await this.tokenBlacklist.blacklist(user.jti, ttlSeconds);

      setImmediate(() => {
        void this.auditService.log({
          userId: user.id,
          action: AuditAction.UPDATE,
          tableCible: 'jwt_blacklist',
          apres: { jti: user.jti, ttlSeconds },
          ipAddress: ip,
          userAgent,
        });
      });

      this.eventEmitter.emit(AppEvent.AUTH_JWT_BLACKLISTED, {
        userId: user.id,
        jti: user.jti,
        ttlSeconds,
      });
    }

    // 3. Audit + event de logout réussi (non bloquant)
    setImmediate(() => {
      void this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGOUT,
        tableCible: 'users',
        enregistrementId: user.id,
        ipAddress: ip,
        userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.AUTH_LOGOUT_SUCCESS, { userId: user.id });
  }

  // ─── Révocation de famille ────────────────────────────────────────────────────

  async revokeTokenFamily(familyId: string, userId: string, reason: 'reuse'): Promise<void> {
    await this.authRepository.revokeFamily(familyId);

    setImmediate(() => {
      void this.auditService.log({
        userId,
        action: AuditAction.DELETE,
        tableCible: 'refresh_tokens',
        apres: { reason, familyId },
      });
    });

    this.eventEmitter.emit(AppEvent.AUTH_REFRESH_REUSED, { userId, familyId });
    this.eventEmitter.emit(AppEvent.AUTH_TOKEN_FAMILY_REVOKED, { userId, familyId, reason });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /**
   * Génère un refresh token cryptographiquement sûr (64 octets / 128 hex chars).
   * Le familyId est créé ici et stocké uniquement en base — le client ne le voit jamais.
   * Le token_hash est un SHA-256 déterministe : permet le lookup sans Argon2.
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const familyId = randomUUID();
    const rawToken = randomBytes(RAW_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const refreshTtl = this.config.get<number>('JWT_REFRESH_TOKEN_TTL', 604800);
    const expiresAt = new Date(Date.now() + (refreshTtl ?? 604800) * 1000);

    await this.authRepository.createRefreshToken({ userId, tokenHash, familyId, expiresAt });

    return rawToken; // familyId jamais exposé au client
  }
}
