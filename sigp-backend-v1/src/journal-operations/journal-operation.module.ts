import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { BudgetLineModule } from '@/budget-lines/budget-line.module';
import { JournalOperationController } from './journal-operation.controller';
import { JournalOperationService } from './journal-operation.service';
import { JournalOperationRepository } from './journal-operation.repository';

@Module({
  imports: [AuditModule, AuthModule, BudgetLineModule],
  controllers: [JournalOperationController],
  providers: [JournalOperationService, JournalOperationRepository],
  exports: [JournalOperationService],
})
export class JournalOperationModule {}
