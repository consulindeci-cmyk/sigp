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
import { WbsService, ActorContext } from './wbs.service';
import { CreateWbsNodeDto } from './dto/create-wbs-node.dto';
import { UpdateWbsNodeDto } from './dto/update-wbs-node.dto';
import { WbsQueryDto } from './dto/wbs-query.dto';
import { WbsResponseDto } from './dto/wbs-response.dto';
import { WbsListResponseDto } from './dto/wbs-list-response.dto';

@ApiTags('wbs')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'wbs', version: '1' })
export class WbsController {
  constructor(private readonly wbsService: WbsService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des nœuds WBS' })
  @ApiOkResponse({ description: 'Liste paginée', type: WbsListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: WbsQueryDto): Promise<WbsListResponseDto> {
    return this.wbsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un nœud WBS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Nœud trouvé', type: WbsResponseDto })
  @ApiNotFoundResponse({ description: 'Nœud introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WbsResponseDto> {
    return this.wbsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nœud WBS' })
  @ApiCreatedResponse({ description: 'Nœud créé', type: WbsResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Projet, objectif ou parent introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Hiérarchie invalide ou conflit de données',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateWbsNodeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<WbsResponseDto> {
    return this.wbsService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un nœud WBS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Nœud modifié', type: WbsResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Nœud, objectif ou parent introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Hiérarchie invalide ou conflit de données',
    type: ApiErrorResponse,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWbsNodeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<WbsResponseDto> {
    return this.wbsService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un nœud WBS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Nœud supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Nœud introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.wbsService.remove(id, this.actor(user, req));
    return { message: 'Nœud WBS supprimé' };
  }
}
