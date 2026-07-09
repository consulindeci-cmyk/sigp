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
import { LogframeIndicatorService, ActorContext } from './logframe-indicator.service';
import { CreateLogframeIndicatorDto } from './dto/create-logframe-indicator.dto';
import { UpdateLogframeIndicatorDto } from './dto/update-logframe-indicator.dto';
import { LogframeIndicatorQueryDto } from './dto/logframe-indicator-query.dto';
import { LogframeIndicatorResponseDto } from './dto/logframe-indicator-response.dto';
import { LogframeIndicatorListResponseDto } from './dto/logframe-indicator-list-response.dto';

@ApiTags('logframe-indicators')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'logframe-indicators', version: '1' })
export class LogframeIndicatorController {
  constructor(private readonly logframeIndicatorService: LogframeIndicatorService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des indicateurs du cadre logique' })
  @ApiOkResponse({ description: 'Liste paginée', type: LogframeIndicatorListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(
    @Query() query: LogframeIndicatorQueryDto,
  ): Promise<LogframeIndicatorListResponseDto> {
    return this.logframeIndicatorService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un indicateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Indicateur trouvé', type: LogframeIndicatorResponseDto })
  @ApiNotFoundResponse({ description: 'Indicateur introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LogframeIndicatorResponseDto> {
    return this.logframeIndicatorService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un indicateur du cadre logique' })
  @ApiCreatedResponse({ description: 'Indicateur créé', type: LogframeIndicatorResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Objectif introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateLogframeIndicatorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LogframeIndicatorResponseDto> {
    return this.logframeIndicatorService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un indicateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Indicateur modifié', type: LogframeIndicatorResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Indicateur introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLogframeIndicatorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LogframeIndicatorResponseDto> {
    return this.logframeIndicatorService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un indicateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Indicateur supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Indicateur introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.logframeIndicatorService.remove(id, this.actor(user, req));
    return { message: 'Indicateur supprimé' };
  }
}
