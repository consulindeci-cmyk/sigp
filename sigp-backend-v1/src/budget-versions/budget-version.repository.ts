import { Injectable } from '@nestjs/common';
import { BudgetStatus, BudgetVersion, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateBudgetVersionData {
  projectId: string;
  version?: number;
  nom: string;
  statut?: BudgetStatus;
  montantTotal?: number;
  approvePar?: string | null;
  approuveLe?: Date | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateBudgetVersionData {
  nom?: string;
  statut?: BudgetStatus;
  montantTotal?: number;
  approvePar?: string | null;
  approuveLe?: Date | null;
  notes?: string | null;
  updatedBy?: string | null;
}

export interface FindBudgetVersionsParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  statut?: BudgetStatus;
  version?: number;
  orderBy: Prisma.BudgetVersionOrderByWithRelationInput;
}

@Injectable()
export class BudgetVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindBudgetVersionsParams,
  ): Promise<{ versions: BudgetVersion[]; total: number }> {
    const where = this.buildWhere(params);

    const [versions, total] = await this.prisma.$transaction([
      this.prisma.budgetVersion.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.budgetVersion.count({ where }),
    ]);

    return { versions, total };
  }

  findById(id: string): Promise<BudgetVersion | null> {
    return this.prisma.budgetVersion.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<BudgetVersion[]> {
    return this.prisma.budgetVersion.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateBudgetVersionData): Promise<BudgetVersion> {
    return this.prisma.budgetVersion.create({
      data: {
        project_id: data.projectId,
        version: data.version ?? 1,
        nom: data.nom,
        statut: data.statut ?? BudgetStatus.BROUILLON,
        montant_total: data.montantTotal ?? 0,
        approuve_par: data.approvePar ?? null,
        approuve_le: data.approuveLe ?? null,
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateBudgetVersionData): Promise<BudgetVersion> {
    return this.prisma.budgetVersion.update({
      where: { id },
      data: {
        nom: data.nom,
        statut: data.statut,
        montant_total: data.montantTotal,
        approuve_par: data.approvePar,
        approuve_le: data.approuveLe,
        notes: data.notes,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.budgetVersion.delete({ where: { id } });
  }

  private buildWhere(params: FindBudgetVersionsParams): Prisma.BudgetVersionWhereInput {
    const where: Prisma.BudgetVersionWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.version !== undefined) {
      where.version = params.version;
    }
    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
