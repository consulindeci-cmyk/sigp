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
import { BudgetLineService, ActorContext } from './budget-line.service';
import { CreateBudgetLineDto } from './dto/create-budget-line.dto';
import { UpdateBudgetLineDto } from './dto/update-budget-line.dto';
import { BudgetLineQueryDto } from './dto/budget-line-query.dto';
import { BudgetLineResponseDto } from './dto/budget-line-response.dto';
import { BudgetLineListResponseDto } from './dto/budget-line-list-response.dto';

@ApiTags('budget-lines')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'budget-lines', version: '1' })
export class BudgetLineController {
  constructor(private readonly budgetLineService: BudgetLineService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des lignes budgétaires' })
  @ApiOkResponse({ description: 'Liste paginée', type: BudgetLineListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: BudgetLineQueryDto): Promise<BudgetLineListResponseDto> {
    return this.budgetLineService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une ligne budgétaire" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Ligne trouvée', type: BudgetLineResponseDto })
  @ApiNotFoundResponse({ description: 'Ligne introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BudgetLineResponseDto> {
    return this.budgetLineService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une ligne budgétaire' })
  @ApiCreatedResponse({ description: 'Ligne créée', type: BudgetLineResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Version budgétaire ou ligne parente introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Code de ligne dupliqué dans la version ou hiérarchie incohérente',
    type: ApiErrorResponse,
  })
  async create(
    @Body() dto: CreateBudgetLineDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BudgetLineResponseDto> {
    return this.budgetLineService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une ligne budgétaire' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Ligne modifiée', type: BudgetLineResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Ligne introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetLineDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<BudgetLineResponseDto> {
    return this.budgetLineService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une ligne budgétaire' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Ligne supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Ligne introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.budgetLineService.remove(id, this.actor(user, req));
    return { message: 'Ligne budgétaire supprimée' };
  }
}
