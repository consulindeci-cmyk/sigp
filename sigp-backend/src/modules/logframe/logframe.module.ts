import { Module } from '@nestjs/common';
import { LogframeController } from './logframe.controller';
import { LogframeService } from './logframe.service';

@Module({
  controllers: [LogframeController],
  providers: [LogframeService],
})
export class LogframeModule {}
