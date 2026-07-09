import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { WbsModule } from '@/wbs/wbs.module';
import { LogframeIndicatorModule } from '@/logframe-indicators/logframe-indicator.module';
import { LogframeObjectiveModule } from '@/logframe-objectives/logframe-objective.module';
import { PtbaController } from './ptba.controller';
import { PtbaService } from './ptba.service';
import { PtbaRepository } from './ptba.repository';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    ProjectModule,
    WbsModule,
    LogframeIndicatorModule,
    LogframeObjectiveModule,
  ],
  controllers: [PtbaController],
  providers: [PtbaService, PtbaRepository],
  exports: [PtbaService],
})
export class PtbaModule {}
