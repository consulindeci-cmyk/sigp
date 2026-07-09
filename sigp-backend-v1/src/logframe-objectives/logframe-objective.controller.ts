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
import { LogframeObjectiveService, ActorContext } from './logframe-objective.service';
import { CreateLogframeObjectiveDto } from './dto/create-logframe-objective.dto';
import { UpdateLogframeObjectiveDto } from './dto/update-logframe-objective.dto';
import { LogframeObjectiveQueryDto } from './dto/logframe-objective-query.dto';
import { LogframeObjectiveResponseDto } from './dto/logframe-objective-response.dto';

@ApiTags('logframe-objectives')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'logframe-objectives', version: '1' })
export class LogframeObjectiveController {
  constructor(private readonly logframeObjectiveService: LogframeObjectiveService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste des objectifs du cadre logique' })
  @ApiOkResponse({ description: "Tableau d'objectifs", type: [LogframeObjectiveResponseDto] })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(
    @Query() query: LogframeObjectiveQueryDto,
  ): Promise<LogframeObjectiveResponseDto[]> {
    return (await this.logframeObjectiveService.findAll(query)).data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un objectif' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Objectif trouvé', type: LogframeObjectiveResponseDto })
  @ApiNotFoundResponse({ description: 'Objectif introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LogframeObjectiveResponseDto> {
    return this.logframeObjectiveService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un objectif du cadre logique' })
  @ApiCreatedResponse({ description: 'Objectif créé', type: LogframeObjectiveResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Projet ou objectif parent introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateLogframeObjectiveDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LogframeObjectiveResponseDto> {
    return this.logframeObjectiveService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un objectif' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Objectif modifié', type: LogframeObjectiveResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Objectif ou parent introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLogframeObjectiveDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LogframeObjectiveResponseDto> {
    return this.logframeObjectiveService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un objectif' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Objectif supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Objectif introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.logframeObjectiveService.remove(id, this.actor(user, req));
    return { message: 'Objectif supprimé' };
  }
}
