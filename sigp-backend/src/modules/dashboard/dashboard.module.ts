import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EvmModule } from '../evm/evm.module';

@Module({
  imports: [EvmModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
