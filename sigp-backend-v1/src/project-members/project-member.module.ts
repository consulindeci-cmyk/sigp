import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { ProjectModule } from '@/projects/project.module';
import { UsersModule } from '@/users/users.module';
import { ProjectMemberController } from './project-member.controller';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberRepository } from './project-member.repository';

@Module({
  imports: [AuditModule, AuthModule, ProjectModule, UsersModule],
  controllers: [ProjectMemberController],
  providers: [ProjectMemberService, ProjectMemberRepository],
  exports: [ProjectMemberService],
})
export class ProjectMemberModule {}
