import { Injectable } from '@nestjs/common';
import { FundingSource, FundingSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateFundingSourceData {
  projectId: string;
  nom: string;
  type?: FundingSourceType;
  montant: number;
  pourcentage?: number | null;
  devise?: string;
  dateAccord?: Date | null;
  dateExpiry?: Date | null;
  contact?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateFundingSourceData {
  nom?: string;
  type?: FundingSourceType;
  montant?: number;
  pourcentage?: number | null;
  devise?: string;
  dateAccord?: Date | null;
  dateExpiry?: Date | null;
  contact?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
}

export interface FindFundingSourcesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  type?: FundingSourceType;
  orderBy: Prisma.FundingSourceOrderByWithRelationInput;
}

@Injectable()
export class FundingSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindFundingSourcesParams,
  ): Promise<{ sources: FundingSource[]; total: number }> {
    const where = this.buildWhere(params);

    const [sources, total] = await this.prisma.$transaction([
      this.prisma.fundingSource.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.fundingSource.count({ where }),
    ]);

    return { sources, total };
  }

  findById(id: string): Promise<FundingSource | null> {
    return this.prisma.fundingSource.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<FundingSource[]> {
    return this.prisma.fundingSource.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateFundingSourceData): Promise<FundingSource> {
    return this.prisma.fundingSource.create({
      data: {
        project_id: data.projectId,
        nom: data.nom,
        type: data.type ?? FundingSourceType.BAILLEUR,
        montant: data.montant,
        pourcentage: data.pourcentage ?? null,
        devise: data.devise ?? 'XOF',
        date_accord: data.dateAccord ?? null,
        date_expiry: data.dateExpiry ?? null,
        contact: data.contact ?? null,
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateFundingSourceData): Promise<FundingSource> {
    return this.prisma.fundingSource.update({
      where: { id },
      data: {
        nom: data.nom,
        type: data.type,
        montant: data.montant,
        pourcentage: data.pourcentage,
        devise: data.devise,
        date_accord: data.dateAccord,
        date_expiry: data.dateExpiry,
        contact: data.contact,
        notes: data.notes,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.fundingSource.delete({ where: { id } });
  }

  private buildWhere(params: FindFundingSourcesParams): Prisma.FundingSourceWhereInput {
    const where: Prisma.FundingSourceWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { contact: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
