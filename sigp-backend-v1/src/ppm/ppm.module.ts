import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { PpmController } from './ppm.controller';
import { PpmService } from './ppm.service';
import { PpmRepository } from './ppm.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule],
  controllers: [PpmController],
  providers: [PpmService, PpmRepository],
  exports: [PpmService],
})
export class PpmModule {}
