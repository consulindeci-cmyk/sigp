import { Injectable } from '@nestjs/common';
import { Prisma, RiskImpact, RiskProbability, RiskStatus, Risque } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateRisqueData {
  projectId: string;
  wbsId?: string | null;
  code?: string | null;
  description: string;
  categorie?: string | null;
  probabilite: RiskProbability;
  impact: RiskImpact;
  niveauCriticite: string;
  statut?: RiskStatus;
  strategie?: string | null;
  planAction?: string | null;
  responsableId?: string | null;
  dateDetection?: Date | null;
  dateEcheance?: Date | null;
  createdBy?: string | null;
}

export interface UpdateRisqueData {
  wbsId?: string | null;
  code?: string | null;
  description?: string;
  categorie?: string | null;
  probabilite?: RiskProbability;
  impact?: RiskImpact;
  niveauCriticite?: string;
  statut?: RiskStatus;
  strategie?: string | null;
  planAction?: string | null;
  responsableId?: string | null;
  dateDetection?: Date | null;
  dateEcheance?: Date | null;
  updatedBy?: string | null;
}

export interface FindRisquesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  probabilite?: RiskProbability;
  impact?: RiskImpact;
  statut?: RiskStatus;
  orderBy: Prisma.RisqueOrderByWithRelationInput;
}

@Injectable()
export class RisqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindRisquesParams,
  ): Promise<{ risques: Risque[]; total: number }> {
    const where = this.buildWhere(params);

    const [risques, total] = await this.prisma.$transaction([
      this.prisma.risque.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.risque.count({ where }),
    ]);

    return { risques, total };
  }

  findById(id: string): Promise<Risque | null> {
    return this.prisma.risque.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<Risque[]> {
    return this.prisma.risque.findMany({ where: { project_id: projectId } });
  }

  findActiveByProject(projectId: string): Promise<Risque[]> {
    return this.prisma.risque.findMany({
      where: {
        project_id: projectId,
        statut: { in: [RiskStatus.OUVERT, RiskStatus.EN_COURS] },
      },
    });
  }

  create(data: CreateRisqueData): Promise<Risque> {
    return this.prisma.risque.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId ?? null,
        code: data.code ?? null,
        description: data.description,
        categorie: data.categorie ?? null,
        probabilite: data.probabilite,
        impact: data.impact,
        niveau_criticite: data.niveauCriticite,
        statut: data.statut ?? undefined,
        strategie: data.strategie ?? null,
        plan_action: data.planAction ?? null,
        responsable_id: data.responsableId ?? null,
        date_detection: data.dateDetection ?? null,
        date_echeance: data.dateEcheance ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateRisqueData): Promise<Risque> {
    return this.prisma.risque.update({
      where: { id },
      data: {
        wbs_id: data.wbsId,
        code: data.code,
        description: data.description,
        categorie: data.categorie,
        probabilite: data.probabilite,
        impact: data.impact,
        niveau_criticite: data.niveauCriticite,
        statut: data.statut,
        strategie: data.strategie,
        plan_action: data.planAction,
        responsable_id: data.responsableId,
        date_detection: data.dateDetection,
        date_echeance: data.dateEcheance,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.risque.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private buildWhere(params: FindRisquesParams): Prisma.RisqueWhereInput {
    const where: Prisma.RisqueWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.probabilite) {
      where.probabilite = params.probabilite;
    }
    if (params.impact) {
      where.impact = params.impact;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { categorie: { contains: params.search, mode: 'insensitive' } },
        { strategie: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
