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
import { DirectionService, ActorContext } from './direction.service';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';
import { DirectionQueryDto } from './dto/direction-query.dto';
import { DirectionResponseDto } from './dto/direction-response.dto';
import { DirectionListResponseDto } from './dto/direction-list-response.dto';

@ApiTags('directions')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'directions', version: '1' })
export class DirectionController {
  constructor(private readonly directionService: DirectionService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des directions' })
  @ApiOkResponse({ description: 'Liste paginée', type: DirectionListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: DirectionQueryDto): Promise<DirectionListResponseDto> {
    return this.directionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une direction' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Direction trouvée', type: DirectionResponseDto })
  @ApiNotFoundResponse({ description: 'Direction introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DirectionResponseDto> {
    return this.directionService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une direction' })
  @ApiCreatedResponse({ description: 'Direction créée', type: DirectionResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Organisation parente introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Code ou nom déjà utilisé dans l’organisation',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateDirectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DirectionResponseDto> {
    return this.directionService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une direction' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Direction modifiée', type: DirectionResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Direction introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Nom déjà utilisé dans l’organisation',
    type: ApiErrorResponse,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDirectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DirectionResponseDto> {
    return this.directionService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une direction' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Direction supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Direction introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.directionService.remove(id, this.actor(user, req));
    return { message: 'Direction supprimée' };
  }
}
