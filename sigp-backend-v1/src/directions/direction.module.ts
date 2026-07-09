import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { OrganisationModule } from '@/organisations/organisation.module';
import { DirectionController } from './direction.controller';
import { DirectionService } from './direction.service';
import { DirectionRepository } from './direction.repository';

@Module({
  imports: [AuditModule, AuthModule, OrganisationModule],
  controllers: [DirectionController],
  providers: [DirectionService, DirectionRepository],
  exports: [DirectionService],
})
export class DirectionModule {}
