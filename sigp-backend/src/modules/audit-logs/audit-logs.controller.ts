import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService, QueryAuditLogsDto } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, ActionAudit } from '@prisma/client';

@ApiTags("Journal d'Audit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.AUDITEUR)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: "Liste des logs d'audit avec filtres (SUPER_ADMIN, AUDITEUR)" })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'module', required: false, description: 'Ex: Tache, projects, risks' })
  @ApiQuery({ name: 'utilisateur_id', required: false })
  @ApiQuery({ name: 'action', required: false, enum: ActionAudit })
  @ApiQuery({ name: 'dateDebut', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'dateFin', required: false, description: 'ISO 8601' })
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }
}
