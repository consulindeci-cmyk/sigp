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
import { PpmService, ActorContext } from './ppm.service';
import { CreatePpmMarcheDto } from './dto/create-ppm-marche.dto';
import { UpdatePpmMarcheDto } from './dto/update-ppm-marche.dto';
import { PpmQueryDto } from './dto/ppm-query.dto';
import { PpmResponseDto } from './dto/ppm-response.dto';
import { PpmListResponseDto } from './dto/ppm-list-response.dto';

@ApiTags('ppm')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'ppm', version: '1' })
export class PpmController {
  constructor(private readonly ppmService: PpmService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des marchés PPM' })
  @ApiOkResponse({ description: 'Liste paginée', type: PpmListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: PpmQueryDto): Promise<PpmListResponseDto> {
    return this.ppmService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un marché PPM" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Marché PPM trouvé', type: PpmResponseDto })
  @ApiNotFoundResponse({ description: 'Marché PPM introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PpmResponseDto> {
    return this.ppmService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un marché PPM' })
  @ApiCreatedResponse({ description: 'Marché PPM créé', type: PpmResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Code marché déjà utilisé dans ce projet',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreatePpmMarcheDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PpmResponseDto> {
    return this.ppmService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un marché PPM' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Marché PPM modifié', type: PpmResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Marché PPM introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePpmMarcheDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PpmResponseDto> {
    return this.ppmService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un marché PPM' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Marché PPM supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Marché PPM introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.ppmService.remove(id, this.actor(user, req));
    return { message: 'Marché PPM supprimé' };
  }
}
