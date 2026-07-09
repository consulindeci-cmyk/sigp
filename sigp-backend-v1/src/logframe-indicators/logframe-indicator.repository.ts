import { Injectable } from '@nestjs/common';
import { IndicatorType, LogframeIndicator, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateLogframeIndicatorData {
  objectiveId: string;
  code: string;
  libelle: string;
  type: IndicatorType;
  unite?: string | null;
  valeurBaseline?: number | null;
  valeurCible?: number | null;
  valeurActuelle?: number | null;
  sourceVerification?: string | null;
  periodicite?: string | null;
  createdBy?: string | null;
}

export interface UpdateLogframeIndicatorData {
  libelle?: string;
  type?: IndicatorType;
  unite?: string | null;
  valeurBaseline?: number | null;
  valeurCible?: number | null;
  valeurActuelle?: number | null;
  sourceVerification?: string | null;
  periodicite?: string | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindLogframeIndicatorsParams {
  skip: number;
  take: number;
  search?: string;
  objectiveId?: string;
  type?: IndicatorType;
  actif?: boolean;
  orderBy: Prisma.LogframeIndicatorOrderByWithRelationInput;
}

@Injectable()
export class LogframeIndicatorRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindLogframeIndicatorsParams,
  ): Promise<{ indicators: LogframeIndicator[]; total: number }> {
    const where = this.buildWhere(params);

    const [indicators, total] = await this.prisma.$transaction([
      this.prisma.logframeIndicator.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.logframeIndicator.count({ where }),
    ]);

    return { indicators, total };
  }

  findById(id: string): Promise<LogframeIndicator | null> {
    return this.prisma.logframeIndicator.findFirst({ where: { id } });
  }

  /** Tous les indicateurs (non supprimés) d'un objectif. */
  findByObjective(objectiveId: string): Promise<LogframeIndicator[]> {
    return this.prisma.logframeIndicator.findMany({ where: { objective_id: objectiveId } });
  }

  create(data: CreateLogframeIndicatorData): Promise<LogframeIndicator> {
    return this.prisma.logframeIndicator.create({
      data: {
        objective_id: data.objectiveId,
        code: data.code,
        libelle: data.libelle,
        type: data.type,
        unite: data.unite ?? null,
        valeur_baseline: data.valeurBaseline ?? null,
        valeur_cible: data.valeurCible ?? null,
        valeur_actuelle: data.valeurActuelle ?? null,
        source_verification: data.sourceVerification ?? null,
        periodicite: data.periodicite ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateLogframeIndicatorData): Promise<LogframeIndicator> {
    return this.prisma.logframeIndicator.update({
      where: { id },
      data: {
        libelle: data.libelle,
        type: data.type,
        unite: data.unite,
        valeur_baseline: data.valeurBaseline,
        valeur_cible: data.valeurCible,
        valeur_actuelle: data.valeurActuelle,
        source_verification: data.sourceVerification,
        periodicite: data.periodicite,
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
    await this.prisma.logframeIndicator.delete({ where: { id } });
  }

  private buildWhere(params: FindLogframeIndicatorsParams): Prisma.LogframeIndicatorWhereInput {
    const where: Prisma.LogframeIndicatorWhereInput = {};

    if (params.objectiveId) {
      where.objective_id = params.objectiveId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { libelle: { contains: params.search, mode: 'insensitive' } },
        { unite: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
