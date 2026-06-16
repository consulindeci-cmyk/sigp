import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [MulterModule.register({ dest: './uploads' })],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
