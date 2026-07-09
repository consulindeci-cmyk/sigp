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
import { RisqueService, ActorContext } from './risque.service';
import { CreateRisqueDto } from './dto/create-risque.dto';
import { UpdateRisqueDto } from './dto/update-risque.dto';
import { RisqueQueryDto } from './dto/risque-query.dto';
import { RisqueResponseDto } from './dto/risque-response.dto';
import { RisqueListResponseDto } from './dto/risque-list-response.dto';

@ApiTags('risques')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'risques', version: '1' })
export class RisqueController {
  constructor(private readonly risqueService: RisqueService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des risques' })
  @ApiOkResponse({ description: 'Liste paginée', type: RisqueListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: RisqueQueryDto): Promise<RisqueListResponseDto> {
    return this.risqueService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un risque" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Risque trouvé', type: RisqueResponseDto })
  @ApiNotFoundResponse({ description: 'Risque introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RisqueResponseDto> {
    return this.risqueService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un risque' })
  @ApiCreatedResponse({ description: 'Risque créé', type: RisqueResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateRisqueDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<RisqueResponseDto> {
    return this.risqueService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un risque' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Risque modifié', type: RisqueResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Risque introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRisqueDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<RisqueResponseDto> {
    return this.risqueService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un risque (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Risque supprimé' })
  @ApiNotFoundResponse({ description: 'Risque introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.risqueService.remove(id, this.actor(user, req));
    return { message: 'Risque supprimé' };
  }
}
