import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { OrganisationRepository } from './organisation.repository';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [OrganisationController],
  providers: [OrganisationService, OrganisationRepository],
  exports: [OrganisationService],
})
export class OrganisationModule {}
