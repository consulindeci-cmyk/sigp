import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { JournalService } from './journal.service';
import { LedgerService } from './ledger.service';
import { OutboxRelayWorker } from './outbox.worker';
import { EvmModule } from '../evm/evm.module';

@Module({
  imports: [EvmModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, JournalService, LedgerService, OutboxRelayWorker],
  exports: [ProjectsService, JournalService, LedgerService],
})
export class ProjectsModule {}
