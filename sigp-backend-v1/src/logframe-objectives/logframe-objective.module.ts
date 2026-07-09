import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { LogframeObjectiveController } from './logframe-objective.controller';
import { LogframeObjectiveService } from './logframe-objective.service';
import { LogframeObjectiveRepository } from './logframe-objective.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [LogframeObjectiveController],
  providers: [LogframeObjectiveService, LogframeObjectiveRepository],
  exports: [LogframeObjectiveService],
})
export class LogframeObjectiveModule {}
