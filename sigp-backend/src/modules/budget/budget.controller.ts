import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une ligne budgétaire' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des lignes budgétaires avec totaux agrégés' })
  findAll(@Param('projectId') projectId: string) {
    return this.budgetService.findAll(projectId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Résumé budgétaire : total, engagé, décaissé, solde' })
  getSummary(@Param('projectId') projectId: string) {
    return this.budgetService.getSummary(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une ligne budgétaire" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.budgetService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour — recalcul automatique du cout_total' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une ligne budgétaire' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.budgetService.remove(projectId, id);
  }
}
