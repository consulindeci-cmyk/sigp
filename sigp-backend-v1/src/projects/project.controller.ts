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
  UseGuards,
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
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectService, ActorContext } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import { ProjectSummaryResponseDto } from './dto/project-summary-response.dto';
import { RiskTopResponseDto } from './dto/risk-top-response.dto';
import { CriticalActivityResponseDto } from './dto/critical-activity-response.dto';
import { DisbursementMonthlyResponseDto } from './dto/disbursement-monthly-response.dto';
import { BudgetDistributionResponseDto } from './dto/budget-distribution-response.dto';
import { FundingSourceResponseDto } from './dto/funding-source-response.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';
import { EvmSummaryResponseDto } from './dto/evm-summary-response.dto';
import { EvmHistoryResponseDto } from './dto/evm-history-response.dto';
import { EvmService } from './evm.service';

@ApiTags('projects')
@Controller({ path: 'projects', version: '1' })
@UseGuards(ProjectAccessGuard)
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly evmService: EvmService,
  ) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      userRole: user.role,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Liste paginée des projets' })
  @ApiOkResponse({ description: 'Liste paginée', type: ProjectListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(
    @Query() query: ProjectQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectListResponseDto> {
    return this.projectService.findAll(query, user);
  }

  @Get(':id/summary')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Synthèse d'un projet" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Synthèse calculée', type: ProjectSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getSummary(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectSummaryResponseDto> {
    return this.projectService.getSummary(id);
  }

  @Get(':id/risks/top')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Top 5 risques actifs du projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Top risques', type: [RiskTopResponseDto] })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getTopRisks(@Param('id', ParseUUIDPipe) id: string): Promise<RiskTopResponseDto[]> {
    return this.projectService.getTopRisks(id);
  }

  @Get(':id/ptba/critical')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Activités PTBA critiques (en retard)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activités critiques', type: [CriticalActivityResponseDto] })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getCriticalActivities(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CriticalActivityResponseDto[]> {
    return this.projectService.getCriticalActivities(id);
  }

  @Get(':id/disbursements/monthly')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Décaissements mensuels du projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Données mensuelles', type: [DisbursementMonthlyResponseDto] })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getDisbursementsMonthly(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisbursementMonthlyResponseDto[]> {
    return this.projectService.getDisbursementsMonthly(id);
  }

  @Get(':id/budget/distribution')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Répartition du budget par rubrique' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Répartition budget', type: [BudgetDistributionResponseDto] })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getBudgetDistribution(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetDistributionResponseDto[]> {
    return this.projectService.getBudgetDistribution(id);
  }

  @Get(':id/funding-sources')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Sources de financement du projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Sources de financement', type: [FundingSourceResponseDto] })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getFundingSources(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FundingSourceResponseDto[]> {
    return this.projectService.getFundingSources(id);
  }

  @Get(':id/milestones')
  @ApiAuth(UserRole.ADMIN, UserRole.COORDINATEUR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Obtenir les prochains jalons (Livrables et Activités)' })
  @ApiParam({ name: 'id', description: 'UUID du projet' })
  @ApiOkResponse({
    description: 'Prochains jalons récupérés avec succès',
    type: [MilestoneResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getMilestones(@Param('id', ParseUUIDPipe) id: string): Promise<MilestoneResponseDto[]> {
    return this.projectService.getMilestones(id);
  }

  @Get(':id/evm/summary')
  @ApiAuth(
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.VIEWER,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Obtenir les indicateurs EVM en temps réel' })
  @ApiParam({ name: 'id', description: 'UUID du projet' })
  @ApiOkResponse({
    description: 'Indicateurs EVM récupérés avec succès',
    type: EvmSummaryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getEvmSummary(@Param('id', ParseUUIDPipe) id: string): Promise<EvmSummaryResponseDto> {
    return this.evmService.getEvmSummary(id);
  }

  @Get(':id/evm/history')
  @ApiAuth(
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.VIEWER,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Obtenir l'historique EVM pour la courbe en S" })
  @ApiParam({ name: 'id', description: 'UUID du projet' })
  @ApiOkResponse({
    description: 'Historique EVM récupéré avec succès',
    type: [EvmHistoryResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async getEvmHistory(@Param('id', ParseUUIDPipe) id: string): Promise<EvmHistoryResponseDto[]> {
    return this.evmService.getEvmHistory(id);
  }

  @Get(':id')
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Détail d'un projet" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Projet trouvé', type: ProjectResponseDto })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    return this.projectService.findOne(id);
  }

  @Post()
  @ApiAuth(UserRole.COORDINATEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un projet' })
  @ApiCreatedResponse({ description: 'Projet créé', type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Programme ou manager introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Code projet déjà utilisé', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    return this.projectService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiAuth(UserRole.COORDINATEUR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Projet modifié', type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({
    description: 'Projet, programme ou manager introuvable',
    type: ApiErrorResponse,
  })
  @ApiConflictResponse({ description: 'Code projet déjà utilisé', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    return this.projectService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @ApiAuth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) un projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Projet supprimé (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.projectService.remove(id, this.actor(user, req));
    return { message: 'Projet supprimé' };
  }
}
