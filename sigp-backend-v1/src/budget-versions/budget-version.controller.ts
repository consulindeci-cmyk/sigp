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
import { BudgetVersionService, ActorContext } from './budget-version.service';
import { CreateBudgetVersionDto } from './dto/create-budget-version.dto';
import { UpdateBudgetVersionDto } from './dto/update-budget-version.dto';
import { BudgetVersionQueryDto } from './dto/budget-version-query.dto';
import { BudgetVersionResponseDto } from './dto/budget-version-response.dto';
import { BudgetVersionListResponseDto } from './dto/budget-version-list-response.dto';

@ApiTags('budget-versions')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'budget-versions', version: '1' })
export class BudgetVersionController {
  constructor(private readonly budgetVersionService: BudgetVersionService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des versions budgétaires' })
  @ApiOkResponse({ description: 'Liste paginée', type: BudgetVersionListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: BudgetVersionQueryDto): Promise<BudgetVersionListResponseDto> {
    return this.budgetVersionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une version budgétaire" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Version trouvée', type: BudgetVersionResponseDto })
  @ApiNotFoundResponse({ description: 'Version introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BudgetVersionResponseDto> {
    return this.budgetVersionService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une version budgétaire' })
  @ApiCreatedResponse({ description: 'Version créée', type: BudgetVersionResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({
    description: 'Version dupliquée pour ce projet',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateBudgetVersionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BudgetVersionResponseDto> {
    return this.budgetVersionService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une version budgétaire' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Version modifiée', type: BudgetVersionResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Version introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetVersionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BudgetVersionResponseDto> {
    return this.budgetVersionService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une version budgétaire' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Version supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Version introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.budgetVersionService.remove(id, this.actor(user, req));
    return { message: 'Version budgétaire supprimée' };
  }
}
