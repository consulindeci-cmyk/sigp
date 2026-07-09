import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { PtbaModule } from '@/ptba/ptba.module';
import { BudgetVersionModule } from '@/budget-versions/budget-version.module';
import { BudgetLineModule } from '@/budget-lines/budget-line.module';
import { RisqueModule } from '@/risques/risque.module';
import { PpmModule } from '@/ppm/ppm.module';
import { LivrableModule } from '@/livrables/livrable.module';
import { DocumentModule } from '@/documents/document.module';
import { ReportModule } from '@/reports/report.module';
import { NotificationModule } from '@/notifications/notification.module';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';

@Module({
  imports: [
    AuthModule,
    ProjectModule,
    PtbaModule,
    BudgetVersionModule,
    BudgetLineModule,
    RisqueModule,
    PpmModule,
    LivrableModule,
    DocumentModule,
    ReportModule,
    NotificationModule,
  ],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
})
export class GlobalSearchModule {}
