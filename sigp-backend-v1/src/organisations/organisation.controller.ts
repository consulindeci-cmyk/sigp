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
import { OrganisationService, ActorContext } from './organisation.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';
import { OrganisationResponseDto } from './dto/organisation-response.dto';
import { OrganisationListResponseDto } from './dto/organisation-list-response.dto';

@ApiTags('organisations')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'organisations', version: '1' })
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des organisations' })
  @ApiOkResponse({ description: 'Liste paginée', type: OrganisationListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: OrganisationQueryDto): Promise<OrganisationListResponseDto> {
    return this.organisationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une organisation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Organisation trouvée', type: OrganisationResponseDto })
  @ApiNotFoundResponse({ description: 'Organisation introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<OrganisationResponseDto> {
    return this.organisationService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une organisation' })
  @ApiCreatedResponse({ description: 'Organisation créée', type: OrganisationResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Code ou nom déjà utilisé', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<OrganisationResponseDto> {
    return this.organisationService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une organisation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Organisation modifiée', type: OrganisationResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Organisation introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Nom déjà utilisé', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<OrganisationResponseDto> {
    return this.organisationService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une organisation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Organisation supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Organisation introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.organisationService.remove(id, this.actor(user, req));
    return { message: 'Organisation supprimée' };
  }
}
