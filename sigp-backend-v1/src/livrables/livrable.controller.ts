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
import { LivrableService, ActorContext } from './livrable.service';
import { CreateLivrableDto } from './dto/create-livrable.dto';
import { UpdateLivrableDto } from './dto/update-livrable.dto';
import { LivrableQueryDto } from './dto/livrable-query.dto';
import { LivrableResponseDto } from './dto/livrable-response.dto';
import { LivrableListResponseDto } from './dto/livrable-list-response.dto';

@ApiTags('livrables')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'livrables', version: '1' })
export class LivrableController {
  constructor(private readonly livrableService: LivrableService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des livrables' })
  @ApiOkResponse({ description: 'Liste paginée', type: LivrableListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: LivrableQueryDto): Promise<LivrableListResponseDto> {
    return this.livrableService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un livrable" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Livrable trouvé', type: LivrableResponseDto })
  @ApiNotFoundResponse({ description: 'Livrable introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LivrableResponseDto> {
    return this.livrableService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un livrable' })
  @ApiCreatedResponse({ description: 'Livrable créé', type: LivrableResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateLivrableDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LivrableResponseDto> {
    return this.livrableService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un livrable' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Livrable modifié', type: LivrableResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Livrable introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLivrableDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<LivrableResponseDto> {
    return this.livrableService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un livrable (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Livrable supprimé' })
  @ApiNotFoundResponse({ description: 'Livrable introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.livrableService.remove(id, this.actor(user, req));
    return { message: 'Livrable supprimé' };
  }
}
