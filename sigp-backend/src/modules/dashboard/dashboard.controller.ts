import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Tableau de bord global (optionnel: ?projectId=xxx pour filtrer)' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filtrer par projet' })
  getGlobal(@Query('projectId') projectId?: string) {
    return this.dashboardService.getGlobal(projectId);
  }
}
