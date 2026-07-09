import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { RisqueController } from './risque.controller';
import { RisqueService } from './risque.service';
import { RisqueRepository } from './risque.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [RisqueController],
  providers: [RisqueService, RisqueRepository],
  exports: [RisqueService],
})
export class RisqueModule {}
