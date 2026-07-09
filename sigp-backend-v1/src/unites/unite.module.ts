import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { DepartementModule } from '@/departements/departement.module';
import { UniteController } from './unite.controller';
import { UniteService } from './unite.service';
import { UniteRepository } from './unite.repository';

@Module({
  imports: [AuditModule, AuthModule, DepartementModule],
  controllers: [UniteController],
  providers: [UniteService, UniteRepository],
  exports: [UniteService],
})
export class UniteModule {}
