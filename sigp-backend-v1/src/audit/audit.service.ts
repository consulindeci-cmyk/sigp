import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import { maskSensitiveFields } from '@/shared/utils/field-mask.util';

export interface AuditLogDto {
  userId?: string;
  projectId?: string;
  action: AuditAction;
  tableCible: string;
  enregistrementId?: string;
  avant?: Record<string, unknown>;
  apres?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: AuditLogDto): Promise<void> {
    try {
      await this.prisma.historique.create({
        data: {
          user_id: dto.userId ?? null,
          project_id: dto.projectId ?? null,
          action: dto.action,
          table_cible: dto.tableCible,
          enregistrement_id: dto.enregistrementId ?? null,
          avant: dto.avant
            ? (maskSensitiveFields(dto.avant) as unknown as Prisma.InputJsonValue)
            : undefined,
          apres: dto.apres
            ? (maskSensitiveFields(dto.apres) as unknown as Prisma.InputJsonValue)
            : undefined,
          ip_address: dto.ipAddress ?? null,
          user_agent: dto.userAgent ?? null,
        },
      });
    } catch (error) {
      // L'audit ne doit jamais faire échouer l'opération principale
      this.logger.error('Failed to write audit log', error);
    }
  }
}
