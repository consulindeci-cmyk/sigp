import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { HistoriqueWithRelations } from './dto/history-response.dto';

export interface FindHistoryParams {
  skip: number;
  take: number;
  projectId?: string;
  userId?: string;
  action?: AuditAction;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  orderBy: Prisma.HistoriqueOrderByWithRelationInput;
}

export interface HistoryStatsParams {
  projectId?: string;
}

const RELATIONS_INCLUDE = {
  user: { select: { id: true, nom: true, prenom: true, role: true } },
  project: { select: { id: true, code: true, nom: true } },
} satisfies Prisma.HistoriqueInclude;

@Injectable()
export class HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindHistoryParams,
  ): Promise<{ entries: HistoriqueWithRelations[]; total: number }> {
    const where = this.buildWhere(params);

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.historique.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        include: RELATIONS_INCLUDE,
      }),
      this.prisma.historique.count({ where }),
    ]);

    return { entries: entries as HistoriqueWithRelations[], total };
  }

  findById(id: string): Promise<HistoriqueWithRelations | null> {
    return this.prisma.historique.findFirst({
      where: { id },
      include: RELATIONS_INCLUDE,
    }) as Promise<HistoriqueWithRelations | null>;
  }

  /** Modules distincts réellement présents dans le journal — jamais une liste inventée. */
  async findDistinctModules(): Promise<string[]> {
    const rows = await this.prisma.historique.findMany({
      distinct: ['table_cible'],
      select: { table_cible: true },
      orderBy: { table_cible: 'asc' },
    });
    return rows.map((r) => r.table_cible);
  }

  async countTotal(projectId?: string): Promise<number> {
    return this.prisma.historique.count({ where: projectId ? { project_id: projectId } : {} });
  }

  async countSince(since: Date, projectId?: string): Promise<number> {
    return this.prisma.historique.count({
      where: { created_at: { gte: since }, ...(projectId ? { project_id: projectId } : {}) },
    });
  }

  async countByAction(
    params: HistoryStatsParams,
  ): Promise<{ action: AuditAction; count: number }[]> {
    const rows = await this.prisma.historique.groupBy({
      by: ['action'],
      where: params.projectId ? { project_id: params.projectId } : {},
      _count: { _all: true },
    });
    return rows.map((r) => ({ action: r.action, count: r._count._all }));
  }

  async countByModule(params: HistoryStatsParams): Promise<{ module: string; count: number }[]> {
    const rows = await this.prisma.historique.groupBy({
      by: ['table_cible'],
      where: params.projectId ? { project_id: params.projectId } : {},
      _count: { _all: true },
      orderBy: { _count: { table_cible: 'desc' } },
    });
    return rows.map((r) => ({ module: r.table_cible, count: r._count._all }));
  }

  /** Volume quotidien sur les 30 derniers jours (date_trunc PostgreSQL — nécessite SQL brut,
   *  Prisma ne supporte pas le regroupement par tronçon de date de façon portable). */
  async dailyVolume(params: HistoryStatsParams): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>(
      params.projectId
        ? Prisma.sql`
            SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
            FROM historique
            WHERE created_at >= ${since} AND project_id = ${params.projectId}::uuid
            GROUP BY day
            ORDER BY day ASC
          `
        : Prisma.sql`
            SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
            FROM historique
            WHERE created_at >= ${since}
            GROUP BY day
            ORDER BY day ASC
          `,
    );

    return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), count: Number(r.count) }));
  }

  private buildWhere(params: FindHistoryParams): Prisma.HistoriqueWhereInput {
    const where: Prisma.HistoriqueWhereInput = {};

    if (params.projectId) where.project_id = params.projectId;
    if (params.userId) where.user_id = params.userId;
    if (params.action) where.action = params.action;
    if (params.module) where.table_cible = params.module;

    if (params.dateFrom || params.dateTo) {
      where.created_at = {
        ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
        ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
      };
    }

    if (params.search) {
      where.OR = [
        { table_cible: { contains: params.search, mode: 'insensitive' } },
        { enregistrement_id: { contains: params.search, mode: 'insensitive' } },
        { user: { nom: { contains: params.search, mode: 'insensitive' } } },
        { user: { prenom: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }
}
