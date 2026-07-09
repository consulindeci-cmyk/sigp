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
import { GouvernanceService, ActorContext } from './gouvernance.service';
import { CreateGouvernanceDto } from './dto/create-gouvernance.dto';
import { UpdateGouvernanceDto } from './dto/update-gouvernance.dto';
import { GouvernanceQueryDto } from './dto/gouvernance-query.dto';
import { GouvernanceResponseDto } from './dto/gouvernance-response.dto';
import { GouvernanceListResponseDto } from './dto/gouvernance-list-response.dto';

@ApiTags('gouvernance')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'gouvernance', version: '1' })
export class GouvernanceController {
  constructor(private readonly gouvernanceService: GouvernanceService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des entrées de gouvernance' })
  @ApiOkResponse({ description: 'Liste paginée', type: GouvernanceListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: GouvernanceQueryDto): Promise<GouvernanceListResponseDto> {
    return this.gouvernanceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une entrée de gouvernance' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Entrée trouvée', type: GouvernanceResponseDto })
  @ApiNotFoundResponse({ description: 'Entrée introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<GouvernanceResponseDto> {
    return this.gouvernanceService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une entrée de gouvernance' })
  @ApiCreatedResponse({ description: 'Entrée créée', type: GouvernanceResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet ou utilisateur introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateGouvernanceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<GouvernanceResponseDto> {
    return this.gouvernanceService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une entrée de gouvernance' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Entrée modifiée', type: GouvernanceResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Entrée ou utilisateur introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGouvernanceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<GouvernanceResponseDto> {
    return this.gouvernanceService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une entrée de gouvernance' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Entrée supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Entrée introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.gouvernanceService.remove(id, this.actor(user, req));
    return { message: 'Entrée de gouvernance supprimée' };
  }
}
