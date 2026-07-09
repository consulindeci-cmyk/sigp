import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { FundingSourceController } from './funding-source.controller';
import { FundingSourceService } from './funding-source.service';
import { FundingSourceRepository } from './funding-source.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [FundingSourceController],
  providers: [FundingSourceService, FundingSourceRepository],
  exports: [FundingSourceService],
})
export class FundingSourceModule {}
