import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { BudgetVersionModule } from '@/budget-versions/budget-version.module';
import { BudgetLineModule } from '@/budget-lines/budget-line.module';
import { PtbaModule } from '@/ptba/ptba.module';
import { RisqueModule } from '@/risques/risque.module';
import { PpmModule } from '@/ppm/ppm.module';
import { PpmEtapeModule } from '@/ppm-etapes/ppm-etape.module';
import { LivrableModule } from '@/livrables/livrable.module';
import { DocumentModule } from '@/documents/document.module';
import { ReportModule } from '@/reports/report.module';
import { NotificationModule } from '@/notifications/notification.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    AuthModule,
    ProjectModule,
    BudgetVersionModule,
    BudgetLineModule,
    PtbaModule,
    RisqueModule,
    PpmModule,
    PpmEtapeModule,
    LivrableModule,
    DocumentModule,
    ReportModule,
    NotificationModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
