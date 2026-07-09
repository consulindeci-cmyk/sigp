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
import { ProgrammeService, ActorContext } from './programme.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { ProgrammeQueryDto } from './dto/programme-query.dto';
import { ProgrammeResponseDto } from './dto/programme-response.dto';
import { ProgrammeListResponseDto } from './dto/programme-list-response.dto';

@ApiTags('programmes')
@Controller({ path: 'programmes', version: '1' })
export class ProgrammeController {
  constructor(private readonly programmeService: ProgrammeService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiAuth()
  @ApiOperation({ summary: 'Liste paginée des programmes' })
  @ApiOkResponse({ description: 'Liste paginée', type: ProgrammeListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: ProgrammeQueryDto): Promise<ProgrammeListResponseDto> {
    return this.programmeService.findAll(query);
  }

  @Get(':id')
  @ApiAuth()
  @ApiOperation({ summary: "Détail d'un programme" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Programme trouvé', type: ProgrammeResponseDto })
  @ApiNotFoundResponse({ description: 'Programme introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProgrammeResponseDto> {
    return this.programmeService.findOne(id);
  }

  @Post()
  @ApiAuth(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un programme' })
  @ApiCreatedResponse({ description: 'Programme créé', type: ProgrammeResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Unité parente introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: "Code ou nom déjà utilisé dans l'unité",
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateProgrammeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProgrammeResponseDto> {
    return this.programmeService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiAuth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un programme' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Programme modifié', type: ProgrammeResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Programme introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: "Nom déjà utilisé dans l'unité", type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgrammeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProgrammeResponseDto> {
    return this.programmeService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @ApiAuth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un programme' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Programme supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Programme introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.programmeService.remove(id, this.actor(user, req));
    return { message: 'Programme supprimé' };
  }
}
