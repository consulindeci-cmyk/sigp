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
  ApiForbiddenResponse,
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
import { CommentService, ActorContext } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@ApiTags('comments')
@ApiAuth(UserRole.VIEWER)
@Controller({ path: 'projects/:projectId/comments', version: '1' })
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      userRole: user.role as UserRole,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: "Liste des commentaires d'un projet" })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ description: 'Liste paginée', type: [CommentResponseDto] })
  @ApiBadRequestResponse({ description: 'Paramètres invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: CommentQueryDto,
  ): Promise<CommentResponseDto[]> {
    return (await this.commentService.findAll(projectId, query)).data;
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un commentaire" })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Commentaire trouvé', type: CommentResponseDto })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable', type: ApiErrorResponse })
  async findOne(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentResponseDto> {
    return this.commentService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un commentaire' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Commentaire créé', type: CommentResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<CommentResponseDto> {
    return this.commentService.create(projectId, dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un commentaire' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Commentaire modifié', type: CommentResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable', type: ApiErrorResponse })
  @ApiForbiddenResponse({ description: 'Modification interdite', type: ApiErrorResponse })
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<CommentResponseDto> {
    return this.commentService.update(projectId, id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un commentaire' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Commentaire supprimé' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable', type: ApiErrorResponse })
  @ApiForbiddenResponse({ description: 'Suppression interdite', type: ApiErrorResponse })
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.commentService.remove(projectId, id, this.actor(user, req));
    return { message: 'Commentaire supprimé' };
  }
}
