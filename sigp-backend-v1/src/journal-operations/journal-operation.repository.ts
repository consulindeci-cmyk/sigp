import { Injectable } from '@nestjs/common';
import { JournalOperation, JournalType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateJournalOperationData {
  budgetLineId: string;
  type: JournalType;
  montant: number;
  dateOperation: Date;
  reference?: string | null;
  description?: string | null;
  pieceJointeId?: string | null;
  createdBy?: string | null;
}

export interface UpdateJournalOperationData {
  type?: JournalType;
  montant?: number;
  dateOperation?: Date;
  reference?: string | null;
  description?: string | null;
  pieceJointeId?: string | null;
  updatedBy?: string | null;
}

export interface FindJournalOperationsParams {
  skip: number;
  take: number;
  search?: string;
  budgetLineId?: string;
  type?: JournalType;
  orderBy: Prisma.JournalOperationOrderByWithRelationInput;
}

@Injectable()
export class JournalOperationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindJournalOperationsParams,
  ): Promise<{ operations: JournalOperation[]; total: number }> {
    const where = this.buildWhere(params);

    const [operations, total] = await this.prisma.$transaction([
      this.prisma.journalOperation.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.journalOperation.count({ where }),
    ]);

    return { operations, total };
  }

  findById(id: string): Promise<JournalOperation | null> {
    return this.prisma.journalOperation.findFirst({ where: { id } });
  }

  findByBudgetLine(budgetLineId: string): Promise<JournalOperation[]> {
    return this.prisma.journalOperation.findMany({
      where: { budget_ligne_id: budgetLineId },
    });
  }

  create(data: CreateJournalOperationData): Promise<JournalOperation> {
    return this.prisma.journalOperation.create({
      data: {
        budget_ligne_id: data.budgetLineId,
        type: data.type,
        montant: data.montant,
        date_operation: data.dateOperation,
        reference: data.reference ?? null,
        description: data.description ?? null,
        piece_jointe_id: data.pieceJointeId ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateJournalOperationData): Promise<JournalOperation> {
    return this.prisma.journalOperation.update({
      where: { id },
      data: {
        type: data.type,
        montant: data.montant,
        date_operation: data.dateOperation,
        reference: data.reference,
        description: data.description,
        piece_jointe_id: data.pieceJointeId,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.journalOperation.delete({ where: { id } });
  }

  private buildWhere(params: FindJournalOperationsParams): Prisma.JournalOperationWhereInput {
    const where: Prisma.JournalOperationWhereInput = {};

    if (params.budgetLineId) {
      where.budget_ligne_id = params.budgetLineId;
    }
    if (params.type) {
      where.type = params.type;
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
