import { Module } from '@nestjs/common';
import { WbsController } from './wbs.controller';
import { WbsService } from './wbs.service';

@Module({ controllers: [WbsController], providers: [WbsService] })
export class WbsModule {}
