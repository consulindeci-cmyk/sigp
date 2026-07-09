import { Injectable } from '@nestjs/common';
import { BudgetLigne, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateBudgetLineData {
  versionId: string;
  parentId?: string | null;
  codeLigne: string;
  libelle: string;
  categorie?: string | null;
  montantPrevu?: number;
  montantEngage?: number;
  montantPaye?: number;
  ordre?: number;
  createdBy?: string | null;
}

export interface UpdateBudgetLineData {
  parentId?: string | null;
  libelle?: string;
  categorie?: string | null;
  montantPrevu?: number;
  montantEngage?: number;
  montantPaye?: number;
  ordre?: number;
  updatedBy?: string | null;
}

export interface FindBudgetLinesParams {
  skip: number;
  take: number;
  search?: string;
  versionId?: string;
  parentId?: string;
  orderBy: Prisma.BudgetLigneOrderByWithRelationInput;
}

@Injectable()
export class BudgetLineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindBudgetLinesParams,
  ): Promise<{ lignes: BudgetLigne[]; total: number }> {
    const where = this.buildWhere(params);

    const [lignes, total] = await this.prisma.$transaction([
      this.prisma.budgetLigne.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.budgetLigne.count({ where }),
    ]);

    return { lignes, total };
  }

  findById(id: string): Promise<BudgetLigne | null> {
    return this.prisma.budgetLigne.findFirst({ where: { id } });
  }

  findByBudgetVersion(versionId: string): Promise<BudgetLigne[]> {
    return this.prisma.budgetLigne.findMany({ where: { version_id: versionId } });
  }

  create(data: CreateBudgetLineData): Promise<BudgetLigne> {
    return this.prisma.budgetLigne.create({
      data: {
        version_id: data.versionId,
        parent_id: data.parentId ?? null,
        code_ligne: data.codeLigne,
        libelle: data.libelle,
        categorie: data.categorie ?? null,
        montant_prevu: data.montantPrevu ?? 0,
        montant_engage: data.montantEngage ?? 0,
        montant_paye: data.montantPaye ?? 0,
        ordre: data.ordre ?? 0,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateBudgetLineData): Promise<BudgetLigne> {
    return this.prisma.budgetLigne.update({
      where: { id },
      data: {
        parent_id: data.parentId,
        libelle: data.libelle,
        categorie: data.categorie,
        montant_prevu: data.montantPrevu,
        montant_engage: data.montantEngage,
        montant_paye: data.montantPaye,
        ordre: data.ordre,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.budgetLigne.delete({ where: { id } });
  }

  private buildWhere(params: FindBudgetLinesParams): Prisma.BudgetLigneWhereInput {
    const where: Prisma.BudgetLigneWhereInput = {};

    if (params.versionId) {
      where.version_id = params.versionId;
    }
    if (params.parentId) {
      where.parent_id = params.parentId;
    }
    if (params.search) {
      where.OR = [
        { code_ligne: { contains: params.search, mode: 'insensitive' } },
        { libelle: { contains: params.search, mode: 'insensitive' } },
        { categorie: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
