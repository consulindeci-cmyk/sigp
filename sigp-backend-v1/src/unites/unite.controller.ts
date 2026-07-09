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
import { UniteService, ActorContext } from './unite.service';
import { CreateUniteDto } from './dto/create-unite.dto';
import { UpdateUniteDto } from './dto/update-unite.dto';
import { UniteQueryDto } from './dto/unite-query.dto';
import { UniteResponseDto } from './dto/unite-response.dto';
import { UniteListResponseDto } from './dto/unite-list-response.dto';

@ApiTags('unites')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'unites', version: '1' })
export class UniteController {
  constructor(private readonly uniteService: UniteService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des unités' })
  @ApiOkResponse({ description: 'Liste paginée', type: UniteListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: UniteQueryDto): Promise<UniteListResponseDto> {
    return this.uniteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une unité' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Unité trouvée', type: UniteResponseDto })
  @ApiNotFoundResponse({ description: 'Unité introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UniteResponseDto> {
    return this.uniteService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une unité' })
  @ApiCreatedResponse({ description: 'Unité créée', type: UniteResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Département parent introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Code ou nom déjà utilisé dans le département',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateUniteDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<UniteResponseDto> {
    return this.uniteService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une unité' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Unité modifiée', type: UniteResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Unité introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Nom déjà utilisé dans le département',
    type: ApiErrorResponse,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUniteDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<UniteResponseDto> {
    return this.uniteService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une unité' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Unité supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Unité introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.uniteService.remove(id, this.actor(user, req));
    return { message: 'Unité supprimée' };
  }
}
