import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.mot_de_passe, saltRounds);

    const user = await this.prisma.utilisateur.create({
      data: {
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        mot_de_passe: hashedPassword,
        role: dto.role,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mot_de_passe: _mdp2, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    if (!user.actif) {
      throw new UnauthorizedException('Compte désactivé. Contactez un administrateur.');
    }
    const isPasswordValid = await bcrypt.compare(dto.mot_de_passe, user.mot_de_passe);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedRefresh = await bcrypt.hash(tokens.refresh_token, saltRounds);

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refresh_token: hashedRefresh },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mot_de_passe, refresh_token: _, ...userResult } = user;
    return { ...tokens, user: userResult };
  }

  async logout(userId: string) {
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
    return { message: 'Déconnexion réussie' };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id: userId, deletedAt: null, actif: true },
    });
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('Accès refusé');
    }
    const isValid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedRefresh = await bcrypt.hash(tokens.refresh_token, saltRounds);

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refresh_token: hashedRefresh },
    });
    return tokens;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const isValid = await bcrypt.compare(dto.ancien_mot_de_passe, user.mot_de_passe);
    if (!isValid) throw new UnauthorizedException('Ancien mot de passe incorrect');

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashed = await bcrypt.hash(dto.nouveau_mot_de_passe, saltRounds);

    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { mot_de_passe: hashed },
    });
    return { message: 'Mot de passe modifié avec succès' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) {
      // Sécurité : ne pas révéler si l'email existe
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
    }
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { reset_password_token: token, reset_password_expires: expires },
    });
    // En production, envoyer un email avec le token
    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      debug_token: token, // Retirer en production
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.utilisateur.findFirst({
      where: {
        reset_password_token: dto.token,
        reset_password_expires: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!user) throw new BadRequestException('Token invalide ou expiré');

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashed = await bcrypt.hash(dto.nouveau_mot_de_passe, saltRounds);

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        mot_de_passe: hashed,
        reset_password_token: null,
        reset_password_expires: null,
        refresh_token: null,
      },
    });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn') ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
      }),
    ]);
    return { access_token, refresh_token };
  }
}
