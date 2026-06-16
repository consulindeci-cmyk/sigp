import { Module } from '@nestjs/common';
import { PtbaController } from './ptba.controller';
import { PtbaService } from './ptba.service';

@Module({
  controllers: [PtbaController],
  providers: [PtbaService],
})
export class PtbaModule {}
