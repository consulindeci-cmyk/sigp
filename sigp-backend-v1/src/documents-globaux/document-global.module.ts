import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UploadsModule } from '@/uploads/uploads.module';
import { DocumentGlobalController } from './document-global.controller';
import { DocumentGlobalService } from './document-global.service';
import { DocumentGlobalRepository } from './document-global.repository';

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, UploadsModule],
  controllers: [DocumentGlobalController],
  providers: [DocumentGlobalService, DocumentGlobalRepository],
  exports: [DocumentGlobalService, DocumentGlobalRepository],
})
export class DocumentGlobalModule {}
