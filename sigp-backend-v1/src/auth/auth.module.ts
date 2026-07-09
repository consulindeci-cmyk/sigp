import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { AuditModule } from '@/audit/audit.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenBlacklistRepository } from './token-blacklist.repository';

function loadRsaKeys(config: ConfigService): { privateKey: Buffer; publicKey: Buffer } {
  const privateKeyPath = config.get<string>('JWT_PRIVATE_KEY_PATH', './keys/private.pem');
  const publicKeyPath = config.get<string>('JWT_PUBLIC_KEY_PATH', './keys/public.pem');

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(
      `[SIGP] FATAL: JWT RSA private key not found at "${privateKeyPath}".\n` +
        `  Run: npm run generate:keys`,
    );
  }
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(
      `[SIGP] FATAL: JWT RSA public key not found at "${publicKeyPath}".\n` +
        `  Run: npm run generate:keys`,
    );
  }

  return {
    privateKey: fs.readFileSync(privateKeyPath),
    publicKey: fs.readFileSync(publicKeyPath),
  };
}

@Module({
  imports: [
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const { privateKey, publicKey } = loadRsaKeys(config);
        const accessTtl = config.get<number>('JWT_ACCESS_TOKEN_TTL', 900);

        return {
          privateKey,
          publicKey,
          signOptions: { algorithm: 'RS256', expiresIn: accessTtl },
          verifyOptions: { algorithms: ['RS256'] },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenBlacklistRepository,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, PassportModule, TokenBlacklistRepository],
})
export class AuthModule {}
