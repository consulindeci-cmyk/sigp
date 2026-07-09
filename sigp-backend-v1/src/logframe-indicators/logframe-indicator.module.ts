import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { LogframeObjectiveModule } from '@/logframe-objectives/logframe-objective.module';
import { LogframeIndicatorController } from './logframe-indicator.controller';
import { LogframeIndicatorService } from './logframe-indicator.service';
import { LogframeIndicatorRepository } from './logframe-indicator.repository';

@Module({
  imports: [AuditModule, AuthModule, LogframeObjectiveModule],
  controllers: [LogframeIndicatorController],
  providers: [LogframeIndicatorService, LogframeIndicatorRepository],
  exports: [LogframeIndicatorService],
})
export class LogframeIndicatorModule {}
