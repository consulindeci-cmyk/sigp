import { Injectable } from '@nestjs/common';
import { Disbursement, DisbursementStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateDisbursementData {
  budgetVersionId?: string | null;
  budgetLineId?: string | null;
  contractId?: string | null;
  fundingSourceId?: string | null;
  statut?: DisbursementStatus;
  montant: number;
  datePrevue?: Date | null;
  dateReelle?: Date | null;
  reference?: string | null;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateDisbursementData {
  contractId?: string | null;
  statut?: DisbursementStatus;
  montant?: number;
  datePrevue?: Date | null;
  dateReelle?: Date | null;
  reference?: string | null;
  description?: string | null;
  updatedBy?: string | null;
}

export interface FindDisbursementsParams {
  skip: number;
  take: number;
  search?: string;
  budgetVersionId?: string;
  budgetLineId?: string;
  fundingSourceId?: string;
  statut?: DisbursementStatus;
  orderBy: Prisma.DisbursementOrderByWithRelationInput;
}

@Injectable()
export class DisbursementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindDisbursementsParams,
  ): Promise<{ disbursements: Disbursement[]; total: number }> {
    const where = this.buildWhere(params);

    const [disbursements, total] = await this.prisma.$transaction([
      this.prisma.disbursement.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.disbursement.count({ where }),
    ]);

    return { disbursements, total };
  }

  findById(id: string): Promise<Disbursement | null> {
    return this.prisma.disbursement.findFirst({ where: { id } });
  }

  findByBudgetVersion(budgetVersionId: string): Promise<Disbursement[]> {
    return this.prisma.disbursement.findMany({ where: { budget_version_id: budgetVersionId } });
  }

  create(data: CreateDisbursementData): Promise<Disbursement> {
    return this.prisma.disbursement.create({
      data: {
        budget_version_id: data.budgetVersionId ?? null,
        budget_ligne_id: data.budgetLineId ?? null,
        contract_id: data.contractId ?? null,
        funding_source_id: data.fundingSourceId ?? null,
        statut: data.statut ?? DisbursementStatus.PLANIFIE,
        montant: data.montant,
        date_prevue: data.datePrevue ?? null,
        date_reelle: data.dateReelle ?? null,
        reference: data.reference ?? null,
        description: data.description ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateDisbursementData): Promise<Disbursement> {
    return this.prisma.disbursement.update({
      where: { id },
      data: {
        contract_id: data.contractId,
        statut: data.statut,
        montant: data.montant,
        date_prevue: data.datePrevue,
        date_reelle: data.dateReelle,
        reference: data.reference,
        description: data.description,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.disbursement.delete({ where: { id } });
  }

  private buildWhere(params: FindDisbursementsParams): Prisma.DisbursementWhereInput {
    const where: Prisma.DisbursementWhereInput = {};

    if (params.budgetVersionId) {
      where.budget_version_id = params.budgetVersionId;
    }
    if (params.budgetLineId) {
      where.budget_ligne_id = params.budgetLineId;
    }
    if (params.fundingSourceId) {
      where.funding_source_id = params.fundingSourceId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { reference: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
