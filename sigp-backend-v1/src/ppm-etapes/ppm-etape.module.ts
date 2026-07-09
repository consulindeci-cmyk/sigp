import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { PpmModule } from '@/ppm/ppm.module';
import { PpmEtapeController } from './ppm-etape.controller';
import { PpmEtapeService } from './ppm-etape.service';
import { PpmEtapeRepository } from './ppm-etape.repository';

@Module({
  imports: [AuditModule, AuthModule, PpmModule],
  controllers: [PpmEtapeController],
  providers: [PpmEtapeService, PpmEtapeRepository],
  exports: [PpmEtapeService],
})
export class PpmEtapeModule {}
