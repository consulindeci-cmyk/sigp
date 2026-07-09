import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { BudgetVersionController } from './budget-version.controller';
import { BudgetVersionService } from './budget-version.service';
import { BudgetVersionRepository } from './budget-version.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [BudgetVersionController],
  providers: [BudgetVersionService, BudgetVersionRepository],
  exports: [BudgetVersionService],
})
export class BudgetVersionModule {}
