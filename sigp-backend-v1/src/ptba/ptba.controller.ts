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
import { PtbaService, ActorContext } from './ptba.service';
import { CreatePtbaActiviteDto } from './dto/create-ptba-activite.dto';
import { UpdatePtbaActiviteDto } from './dto/update-ptba-activite.dto';
import { PtbaQueryDto } from './dto/ptba-query.dto';
import { PtbaResponseDto } from './dto/ptba-response.dto';
import { PtbaListResponseDto } from './dto/ptba-list-response.dto';

@ApiTags('ptba')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'ptba', version: '1' })
export class PtbaController {
  constructor(private readonly ptbaService: PtbaService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des activités PTBA' })
  @ApiOkResponse({ description: 'Liste paginée', type: PtbaListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: PtbaQueryDto): Promise<PtbaListResponseDto> {
    return this.ptbaService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une activité PTBA' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activité trouvée', type: PtbaResponseDto })
  @ApiNotFoundResponse({ description: 'Activité introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PtbaResponseDto> {
    return this.ptbaService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une activité PTBA' })
  @ApiCreatedResponse({ description: 'Activité créée', type: PtbaResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Projet, WBS ou indicateur introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Rattachement incohérent ou conflit de données',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreatePtbaActiviteDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PtbaResponseDto> {
    return this.ptbaService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une activité PTBA' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activité modifiée', type: PtbaResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Activité, WBS ou indicateur introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Rattachement incohérent ou conflit de données',
    type: ApiErrorResponse,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePtbaActiviteDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PtbaResponseDto> {
    return this.ptbaService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une activité PTBA' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activité supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Activité introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.ptbaService.remove(id, this.actor(user, req));
    return { message: 'Activité PTBA supprimée' };
  }
}
