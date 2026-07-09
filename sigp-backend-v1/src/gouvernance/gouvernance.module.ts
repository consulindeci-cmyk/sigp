import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { UsersModule } from '@/users/users.module';
import { GouvernanceController } from './gouvernance.controller';
import { GouvernanceService } from './gouvernance.service';
import { GouvernanceRepository } from './gouvernance.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule, UsersModule],
  controllers: [GouvernanceController],
  providers: [GouvernanceService, GouvernanceRepository],
  exports: [GouvernanceService],
})
export class GouvernanceModule {}
