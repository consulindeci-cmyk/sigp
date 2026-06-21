import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { LogframeModule } from './modules/logframe/logframe.module';
import { PtbaModule } from './modules/ptba/ptba.module';
import { BudgetModule } from './modules/budget/budget.module';
import { FundingModule } from './modules/funding/funding.module';
import { WbsModule } from './modules/wbs/wbs.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { RisksModule } from './modules/risks/risks.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EvmModule } from './modules/evm/evm.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    LogframeModule,
    PtbaModule,
    BudgetModule,
    FundingModule,
    WbsModule,
    TasksModule,
    OperationsModule,
    ProcurementModule,
    RisksModule,
    DocumentsModule,
    EvmModule,
    DashboardModule,
    AuditLogsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
