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
import { DepartementService, ActorContext } from './departement.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { DepartementQueryDto } from './dto/departement-query.dto';
import { DepartementResponseDto } from './dto/departement-response.dto';
import { DepartementListResponseDto } from './dto/departement-list-response.dto';

@ApiTags('departements')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'departements', version: '1' })
export class DepartementController {
  constructor(private readonly departementService: DepartementService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des départements' })
  @ApiOkResponse({ description: 'Liste paginée', type: DepartementListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: DepartementQueryDto): Promise<DepartementListResponseDto> {
    return this.departementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un département' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Département trouvé', type: DepartementResponseDto })
  @ApiNotFoundResponse({ description: 'Département introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DepartementResponseDto> {
    return this.departementService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un département' })
  @ApiCreatedResponse({ description: 'Département créé', type: DepartementResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Direction parente introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Code ou nom déjà utilisé dans la direction',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateDepartementDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DepartementResponseDto> {
    return this.departementService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un département' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Département modifié', type: DepartementResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Département introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Nom déjà utilisé dans la direction',
    type: ApiErrorResponse,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartementDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DepartementResponseDto> {
    return this.departementService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un département' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Département supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Département introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.departementService.remove(id, this.actor(user, req));
    return { message: 'Département supprimé' };
  }
}
