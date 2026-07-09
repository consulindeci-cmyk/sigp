import { Injectable } from '@nestjs/common';
import { LogframeLevel, LogframeObjective, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateLogframeObjectiveData {
  projectId: string;
  niveau: LogframeLevel;
  code: string;
  libelle: string;
  description?: string | null;
  parentId?: string | null;
  ordre?: number;
  createdBy?: string | null;
}

export interface UpdateLogframeObjectiveData {
  niveau?: LogframeLevel;
  libelle?: string;
  description?: string | null;
  parentId?: string | null;
  ordre?: number;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindLogframeObjectivesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  niveau?: LogframeLevel;
  parentId?: string;
  actif?: boolean;
  orderBy: Prisma.LogframeObjectiveOrderByWithRelationInput;
}

@Injectable()
export class LogframeObjectiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindLogframeObjectivesParams,
  ): Promise<{ objectives: LogframeObjective[]; total: number }> {
    const where = this.buildWhere(params);

    const [objectives, total] = await this.prisma.$transaction([
      this.prisma.logframeObjective.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.logframeObjective.count({ where }),
    ]);

    return { objectives, total };
  }

  findById(id: string): Promise<LogframeObjective | null> {
    return this.prisma.logframeObjective.findFirst({ where: { id } });
  }

  /** Tous les objectifs (non supprimés) d'un projet. */
  findByProject(projectId: string): Promise<LogframeObjective[]> {
    return this.prisma.logframeObjective.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateLogframeObjectiveData): Promise<LogframeObjective> {
    return this.prisma.logframeObjective.create({
      data: {
        project_id: data.projectId,
        niveau: data.niveau,
        code: data.code,
        libelle: data.libelle,
        description: data.description ?? null,
        parent_id: data.parentId ?? null,
        ordre: data.ordre ?? 0,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateLogframeObjectiveData): Promise<LogframeObjective> {
    return this.prisma.logframeObjective.update({
      where: { id },
      data: {
        niveau: data.niveau,
        libelle: data.libelle,
        description: data.description,
        parent_id: data.parentId,
        ordre: data.ordre,
        actif: data.actif,
        updated_by: data.updatedBy,
      },
    });
  }

  /**
   * Soft Delete : `.delete()` est intercepté par le middleware et transformé
   * en `update({ deleted_at })`. Aucune suppression physique.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.logframeObjective.delete({ where: { id } });
  }

  private buildWhere(params: FindLogframeObjectivesParams): Prisma.LogframeObjectiveWhereInput {
    const where: Prisma.LogframeObjectiveWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.niveau) {
      where.niveau = params.niveau;
    }
    if (params.parentId) {
      where.parent_id = params.parentId;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { libelle: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
