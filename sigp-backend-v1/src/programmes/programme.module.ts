import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { UniteModule } from '@/unites/unite.module';
import { ProgrammeController } from './programme.controller';
import { ProgrammeService } from './programme.service';
import { ProgrammeRepository } from './programme.repository';

@Module({
  imports: [AuditModule, AuthModule, UniteModule],
  controllers: [ProgrammeController],
  providers: [ProgrammeService, ProgrammeRepository],
  exports: [ProgrammeService],
})
export class ProgrammeModule {}
