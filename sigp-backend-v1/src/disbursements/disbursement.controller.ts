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
import { DisbursementService, ActorContext } from './disbursement.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';
import { DisbursementResponseDto } from './dto/disbursement-response.dto';
import { DisbursementListResponseDto } from './dto/disbursement-list-response.dto';

@ApiTags('disbursements')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'disbursements', version: '1' })
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des décaissements' })
  @ApiOkResponse({ description: 'Liste paginée', type: DisbursementListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: DisbursementQueryDto): Promise<DisbursementListResponseDto> {
    return this.disbursementService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un décaissement" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Décaissement trouvé', type: DisbursementResponseDto })
  @ApiNotFoundResponse({ description: 'Décaissement introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DisbursementResponseDto> {
    return this.disbursementService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un décaissement' })
  @ApiCreatedResponse({ description: 'Décaissement créé', type: DisbursementResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Ressource liée introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Incohérence métier ou conflit de données',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateDisbursementDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DisbursementResponseDto> {
    return this.disbursementService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un décaissement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Décaissement modifié', type: DisbursementResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Décaissement introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisbursementDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DisbursementResponseDto> {
    return this.disbursementService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un décaissement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Décaissement supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Décaissement introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.disbursementService.remove(id, this.actor(user, req));
    return { message: 'Décaissement supprimé' };
  }
}
