import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { BudgetVersionModule } from '@/budget-versions/budget-version.module';
import { BudgetLineModule } from '@/budget-lines/budget-line.module';
import { FundingSourceModule } from '@/funding-sources/funding-source.module';
import { DisbursementController } from './disbursement.controller';
import { DisbursementService } from './disbursement.service';
import { DisbursementRepository } from './disbursement.repository';

@Module({
  imports: [AuditModule, AuthModule, BudgetVersionModule, BudgetLineModule, FundingSourceModule],
  controllers: [DisbursementController],
  providers: [DisbursementService, DisbursementRepository],
  exports: [DisbursementService],
})
export class DisbursementModule {}
