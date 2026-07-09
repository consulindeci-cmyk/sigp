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
import { ProjectMemberService, ActorContext } from './project-member.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { ProjectMemberQueryDto } from './dto/project-member-query.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { ProjectMemberListResponseDto } from './dto/project-member-list-response.dto';

@ApiTags('project-members')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'project-members', version: '1' })
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des membres de projet' })
  @ApiOkResponse({ description: 'Liste paginée', type: ProjectMemberListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: ProjectMemberQueryDto): Promise<ProjectMemberListResponseDto> {
    return this.projectMemberService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un membre de projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Membre trouvé', type: ProjectMemberResponseDto })
  @ApiNotFoundResponse({ description: 'Membre introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectMemberResponseDto> {
    return this.projectMemberService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un membre à un projet' })
  @ApiCreatedResponse({ description: 'Membre ajouté', type: ProjectMemberResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet ou utilisateur introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'L’utilisateur est déjà membre du projet',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateProjectMemberDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProjectMemberResponseDto> {
    return this.projectMemberService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un membre de projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Membre modifié', type: ProjectMemberResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Membre introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProjectMemberResponseDto> {
    return this.projectMemberService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer (soft delete) un membre de projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Membre retiré (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Membre introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.projectMemberService.remove(id, this.actor(user, req));
    return { message: 'Membre retiré du projet' };
  }
}
