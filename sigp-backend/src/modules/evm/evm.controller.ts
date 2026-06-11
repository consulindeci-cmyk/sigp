import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvmService } from './evm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('EVM — Earned Value Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/evm')
export class EvmController {
  constructor(private readonly evmService: EvmService) {}

  @Get()
  @ApiOperation({ summary: 'EVM global du projet (optionnel: ?dateControle=YYYY-MM-DD)' })
  getProjectEvm(
    @Param('projectId') projectId: string,
    @Query('dateControle') dateControle?: string,
  ) {
    return this.evmService.calculateProjectEvm(
      projectId,
      dateControle ? new Date(dateControle) : undefined,
    );
  }

  @Get('tasks')
  @ApiOperation({ summary: 'EVM détaillé par tâche' })
  getTasksEvm(@Param('projectId') projectId: string, @Query('dateControle') dateControle?: string) {
    return this.evmService.calculateTasksEvm(
      projectId,
      dateControle ? new Date(dateControle) : undefined,
    );
  }

  @Get('trend')
  @ApiOperation({ summary: 'Évolution mensuelle PV/EV/AC (tableau pour graphique)' })
  getTrend(@Param('projectId') projectId: string) {
    return this.evmService.calculateTrend(projectId);
  }
}
