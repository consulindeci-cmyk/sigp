import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { PtbaModule } from '@/ptba/ptba.module';
import { BudgetVersionModule } from '@/budget-versions/budget-version.module';
import { BudgetLineModule } from '@/budget-lines/budget-line.module';
import { JournalOperationModule } from '@/journal-operations/journal-operation.module';
import { FundingSourceModule } from '@/funding-sources/funding-source.module';
import { DisbursementModule } from '@/disbursements/disbursement.module';
import { ContractModule } from '@/contracts/contract.module';
import { PpmModule } from '@/ppm/ppm.module';
import { PpmEtapeModule } from '@/ppm-etapes/ppm-etape.module';
import { RisqueModule } from '@/risques/risque.module';
import { LivrableModule } from '@/livrables/livrable.module';
import { DocumentModule } from '@/documents/document.module';
import { ReportModule } from '@/reports/report.module';
import { NotificationModule } from '@/notifications/notification.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    AuthModule,
    ProjectModule,
    PtbaModule,
    BudgetVersionModule,
    BudgetLineModule,
    JournalOperationModule,
    FundingSourceModule,
    DisbursementModule,
    ContractModule,
    PpmModule,
    PpmEtapeModule,
    RisqueModule,
    LivrableModule,
    DocumentModule,
    ReportModule,
    NotificationModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
