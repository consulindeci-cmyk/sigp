import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { DirectionModule } from '@/directions/direction.module';
import { DepartementController } from './departement.controller';
import { DepartementService } from './departement.service';
import { DepartementRepository } from './departement.repository';

@Module({
  imports: [AuditModule, AuthModule, DirectionModule],
  controllers: [DepartementController],
  providers: [DepartementService, DepartementRepository],
  exports: [DepartementService],
})
export class DepartementModule {}
