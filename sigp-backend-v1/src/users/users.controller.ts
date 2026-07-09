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
import { UsersService, ActorContext } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';

@ApiTags('users')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des utilisateurs' })
  @ApiOkResponse({ description: 'Liste paginée', type: UserListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un utilisateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Utilisateur trouvé', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un utilisateur' })
  @ApiCreatedResponse({ description: 'Utilisateur créé', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Email déjà utilisé', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Utilisateur modifié', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un utilisateur' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Utilisateur supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.usersService.remove(id, this.actor(user, req));
    return { message: 'Utilisateur supprimé' };
  }
}
