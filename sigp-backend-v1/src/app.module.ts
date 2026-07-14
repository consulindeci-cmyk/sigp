import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganisationModule } from './organisations/organisation.module';
import { DirectionModule } from './directions/direction.module';
import { DepartementModule } from './departements/departement.module';
import { UniteModule } from './unites/unite.module';
import { ProgrammeModule } from './programmes/programme.module';
import { ProjectModule } from './projects/project.module';
import { ProjectMemberModule } from './project-members/project-member.module';
import { GouvernanceModule } from './gouvernance/gouvernance.module';
import { LogframeObjectiveModule } from './logframe-objectives/logframe-objective.module';
import { LogframeIndicatorModule } from './logframe-indicators/logframe-indicator.module';
import { WbsModule } from './wbs/wbs.module';
import { PtbaModule } from './ptba/ptba.module';
import { BudgetVersionModule } from './budget-versions/budget-version.module';
import { BudgetLineModule } from './budget-lines/budget-line.module';
import { JournalOperationModule } from './journal-operations/journal-operation.module';
import { FundingSourceModule } from './funding-sources/funding-source.module';
import { DisbursementModule } from './disbursements/disbursement.module';
import { ContractModule } from './contracts/contract.module';
import { PpmModule } from './ppm/ppm.module';
import { PpmEtapeModule } from './ppm-etapes/ppm-etape.module';
import { RisqueModule } from './risques/risque.module';
import { LivrableModule } from './livrables/livrable.module';
import { DocumentModule } from './documents/document.module';
import { DocumentGlobalModule } from './documents-globaux/document-global.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReportModule } from './reports/report.module';
import { NotificationModule } from './notifications/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GlobalSearchModule } from './global-search/global-search.module';
import { ExportModule } from './exports/export.module';
import { SystemModule } from './system/system.module';
import { AuditModule } from './audit/audit.module';
import { QueueModule } from './queues/queue.module';
import { SchedulerAppModule } from './scheduler/scheduler.module';
import { CommentModule } from './comments/comment.module';

@Module({
  imports: [
    // Infrastructure
    ConfigModule,
    LoggerModule,

    // EventEmitter2 — cross-module events (AppEvent enum)
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      ignoreErrors: false,
    }),

    // Core
    PrismaModule,
    SharedModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    OrganisationModule,
    DirectionModule,
    DepartementModule,
    UniteModule,
    ProgrammeModule,
    ProjectModule,
    ProjectMemberModule,
    GouvernanceModule,
    LogframeObjectiveModule,
    LogframeIndicatorModule,
    WbsModule,
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
    UploadsModule,
    DocumentModule,
    DocumentGlobalModule,
    ReportModule,
    NotificationModule,
    DashboardModule,
    GlobalSearchModule,
    ExportModule,
    SystemModule,
    AuditModule,
    QueueModule,
    SchedulerAppModule,
    CommentModule,
  ],
})
export class AppModule {}
