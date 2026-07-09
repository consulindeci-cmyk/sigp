import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { LogframeObjectiveModule } from '@/logframe-objectives/logframe-objective.module';
import { WbsController } from './wbs.controller';
import { WbsService } from './wbs.service';
import { WbsRepository } from './wbs.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule, LogframeObjectiveModule],
  controllers: [WbsController],
  providers: [WbsService, WbsRepository],
  exports: [WbsService],
})
export class WbsModule {}
