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
import { JournalOperationService, ActorContext } from './journal-operation.service';
import { CreateJournalOperationDto } from './dto/create-journal-operation.dto';
import { UpdateJournalOperationDto } from './dto/update-journal-operation.dto';
import { JournalOperationQueryDto } from './dto/journal-operation-query.dto';
import { JournalOperationResponseDto } from './dto/journal-operation-response.dto';
import { JournalOperationListResponseDto } from './dto/journal-operation-list-response.dto';

@ApiTags('journal-operations')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'journal-operations', version: '1' })
export class JournalOperationController {
  constructor(private readonly journalOperationService: JournalOperationService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des opérations de journal' })
  @ApiOkResponse({ description: 'Liste paginée', type: JournalOperationListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(
    @Query() query: JournalOperationQueryDto,
  ): Promise<JournalOperationListResponseDto> {
    return this.journalOperationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une opération de journal" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Opération trouvée', type: JournalOperationResponseDto })
  @ApiNotFoundResponse({ description: 'Opération introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<JournalOperationResponseDto> {
    return this.journalOperationService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une opération de journal' })
  @ApiCreatedResponse({ description: 'Opération créée', type: JournalOperationResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Ligne budgétaire introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateJournalOperationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<JournalOperationResponseDto> {
    return this.journalOperationService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une opération de journal' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Opération modifiée', type: JournalOperationResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Opération introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJournalOperationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<JournalOperationResponseDto> {
    return this.journalOperationService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une opération de journal' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Opération supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Opération introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.journalOperationService.remove(id, this.actor(user, req));
    return { message: 'Opération de journal supprimée' };
  }
}
