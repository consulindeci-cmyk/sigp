import { Module } from '@nestjs/common';
import { UploadRepository } from './uploads.repository';
import { UploadsService } from './uploads.service';

@Module({
  providers: [UploadRepository, UploadsService],
  exports: [UploadsService, UploadRepository],
})
export class UploadsModule {}
