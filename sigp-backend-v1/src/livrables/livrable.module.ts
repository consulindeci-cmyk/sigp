import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { LivrableController } from './livrable.controller';
import { LivrableService } from './livrable.service';
import { LivrableRepository } from './livrable.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [LivrableController],
  providers: [LivrableService, LivrableRepository],
  exports: [LivrableService],
})
export class LivrableModule {}
