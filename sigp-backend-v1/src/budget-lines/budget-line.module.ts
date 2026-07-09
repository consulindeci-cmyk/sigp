import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { BudgetVersionModule } from '@/budget-versions/budget-version.module';
import { BudgetLineController } from './budget-line.controller';
import { BudgetLineService } from './budget-line.service';
import { BudgetLineRepository } from './budget-line.repository';

@Module({
  imports: [AuditModule, AuthModule, BudgetVersionModule],
  controllers: [BudgetLineController],
  providers: [BudgetLineService, BudgetLineRepository],
  exports: [BudgetLineService],
})
export class BudgetLineModule {}
