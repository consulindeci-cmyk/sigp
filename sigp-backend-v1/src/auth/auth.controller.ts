import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Identifiants → Access Token JWT RS256 (15 min) + Refresh Token (7 jours)',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Connexion réussie', type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Email ou mot de passe invalide',
    type: ApiErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Compte désactivé par un administrateur',
    type: ApiErrorResponse,
  })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    const ip = req.ip ?? (req.socket.remoteAddress as string | undefined);
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotation du Refresh Token',
    description:
      'Échange un Refresh Token valide contre un nouvel Access Token et un nouveau Refresh Token. ' +
      'Tout token réutilisé déclenche la révocation complète de la famille.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'Tokens rafraîchis avec succès', type: RefreshResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token invalide, expiré ou réutilisé (family révoquée)',
    type: ApiErrorResponse,
  })
  @ApiForbiddenResponse({ description: 'Compte désactivé', type: ApiErrorResponse })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<RefreshResponseDto> {
    const ip = req.ip ?? (req.socket.remoteAddress as string | undefined);
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto, ip, userAgent);
  }

  @Post('logout')
  @ApiAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déconnexion sécurisée',
    description:
      'Révoque la Token Family du refresh token courant (aucune rotation ultérieure possible) ' +
      "et blackliste l'Access Token JWT dans Redis jusqu'à son expiration naturelle. " +
      'JWT obligatoire.',
  })
  @ApiBody({ type: LogoutDto })
  @ApiOkResponse({ description: 'Déconnexion réussie', type: LogoutResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token JWT absent, invalide, expiré ou révoqué',
    type: ApiErrorResponse,
  })
  @ApiForbiddenResponse({ description: 'Accès refusé', type: ApiErrorResponse })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
    @Req() req: Request,
  ): Promise<LogoutResponseDto> {
    const ip = req.ip ?? (req.socket.remoteAddress as string | undefined);
    const userAgent = req.headers['user-agent'];
    await this.authService.logout(user, dto, ip, userAgent);
    return { message: 'Déconnexion réussie' };
  }
}
