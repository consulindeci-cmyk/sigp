import { Injectable } from '@nestjs/common';
import { Contract, ContractStatus, ContractType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateContractData {
  projectId: string;
  marcheId?: string | null;
  numero: string;
  intitule: string;
  type?: ContractType;
  statut?: ContractStatus;
  titulaire: string;
  montant: number;
  devise?: string;
  dateSignature?: Date | null;
  dateDebut?: Date | null;
  dateFin?: Date | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateContractData {
  marcheId?: string | null;
  numero?: string;
  intitule?: string;
  type?: ContractType;
  statut?: ContractStatus;
  titulaire?: string;
  montant?: number;
  devise?: string;
  dateSignature?: Date | null;
  dateDebut?: Date | null;
  dateFin?: Date | null;
  notes?: string | null;
  updatedBy?: string | null;
}

export interface FindContractsParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  type?: ContractType;
  statut?: ContractStatus;
  orderBy: Prisma.ContractOrderByWithRelationInput;
}

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindContractsParams,
  ): Promise<{ contracts: Contract[]; total: number }> {
    const where = this.buildWhere(params);

    const [contracts, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { contracts, total };
  }

  findById(id: string): Promise<Contract | null> {
    return this.prisma.contract.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateContractData): Promise<Contract> {
    return this.prisma.contract.create({
      data: {
        project_id: data.projectId,
        marche_id: data.marcheId ?? null,
        numero: data.numero,
        intitule: data.intitule,
        type: data.type ?? ContractType.MARCHE,
        statut: data.statut ?? ContractStatus.ACTIF,
        titulaire: data.titulaire,
        montant: data.montant,
        devise: data.devise ?? 'XOF',
        date_signature: data.dateSignature ?? null,
        date_debut: data.dateDebut ?? null,
        date_fin: data.dateFin ?? null,
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateContractData): Promise<Contract> {
    return this.prisma.contract.update({
      where: { id },
      data: {
        marche_id: data.marcheId,
        numero: data.numero,
        intitule: data.intitule,
        type: data.type,
        statut: data.statut,
        titulaire: data.titulaire,
        montant: data.montant,
        devise: data.devise,
        date_signature: data.dateSignature,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
        notes: data.notes,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }

  private buildWhere(params: FindContractsParams): Prisma.ContractWhereInput {
    const where: Prisma.ContractWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { numero: { contains: params.search, mode: 'insensitive' } },
        { intitule: { contains: params.search, mode: 'insensitive' } },
        { titulaire: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
