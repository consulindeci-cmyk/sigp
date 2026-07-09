import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { PpmEtapeService, ActorContext } from './ppm-etape.service';
import { CreatePpmEtapeDto } from './dto/create-ppm-etape.dto';
import { UpdatePpmEtapeDto } from './dto/update-ppm-etape.dto';
import { PpmEtapeQueryDto } from './dto/ppm-etape-query.dto';
import { PpmEtapeResponseDto } from './dto/ppm-etape-response.dto';
import { PpmEtapeListResponseDto } from './dto/ppm-etape-list-response.dto';

@ApiTags('ppm-etapes')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'ppm-etapes', version: '1' })
export class PpmEtapeController {
  constructor(private readonly ppmEtapeService: PpmEtapeService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des étapes PPM' })
  @ApiOkResponse({ description: 'Liste paginée', type: PpmEtapeListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: PpmEtapeQueryDto): Promise<PpmEtapeListResponseDto> {
    return this.ppmEtapeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une étape PPM" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Étape PPM trouvée', type: PpmEtapeResponseDto })
  @ApiNotFoundResponse({ description: 'Étape PPM introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PpmEtapeResponseDto> {
    return this.ppmEtapeService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une étape PPM' })
  @ApiCreatedResponse({ description: 'Étape PPM créée', type: PpmEtapeResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Marché PPM introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreatePpmEtapeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PpmEtapeResponseDto> {
    return this.ppmEtapeService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une étape PPM' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Étape PPM modifiée', type: PpmEtapeResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Étape PPM introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePpmEtapeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PpmEtapeResponseDto> {
    return this.ppmEtapeService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une étape PPM' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Étape PPM supprimée' })
  @ApiNotFoundResponse({ description: 'Étape PPM introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.ppmEtapeService.remove(id, this.actor(user, req));
    return { message: 'Étape PPM supprimée' };
  }
}
