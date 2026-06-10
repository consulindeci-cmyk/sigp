import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActionAudit } from '@prisma/client';

export class QueryAuditLogsDto {
  page?: number = 1;
  limit?: number = 20;
  module?: string;
  utilisateur_id?: string;
  action?: ActionAudit;
  dateDebut?: string;
  dateFin?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAuditLogsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.module) where.module = { contains: query.module, mode: 'insensitive' };
    if (query.utilisateur_id) where.utilisateur_id = query.utilisateur_id;
    if (query.action) where.action = query.action;
    if (query.dateDebut || query.dateFin) {
      where.horodatage = {};
      if (query.dateDebut) where.horodatage.gte = new Date(query.dateDebut);
      if (query.dateFin) where.horodatage.lte = new Date(query.dateFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { horodatage: 'desc' },
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
