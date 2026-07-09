import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';

@ApiTags('Dashboard')
@ApiAuth(UserRole.VIEWER)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Données agrégées du tableau de bord SIGP' })
  @ApiOkResponse({ description: 'Dashboard généré avec succès', type: DashboardResponseDto })
  getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard(user.id, user.role);
  }
}
