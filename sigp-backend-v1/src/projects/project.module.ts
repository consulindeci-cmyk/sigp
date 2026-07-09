import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProgrammeModule } from '@/programmes/programme.module';
import { UsersModule } from '@/users/users.module';
import { RisqueRepository } from '@/risques/risque.repository';
import { PtbaRepository } from '@/ptba/ptba.repository';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { EvmService } from './evm.service';

@Module({
  imports: [AuditModule, AuthModule, ProgrammeModule, UsersModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, RisqueRepository, PtbaRepository, EvmService],
  exports: [ProjectService],
})
export class ProjectModule {}
