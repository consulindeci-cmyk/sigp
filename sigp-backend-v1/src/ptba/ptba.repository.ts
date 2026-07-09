import { Injectable } from '@nestjs/common';
import { Prisma, PtbaActivite, PtbaStatut } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreatePtbaActiviteData {
  projectId: string;
  wbsId?: string | null;
  logframeRefId?: string | null;
  code: string;
  libelle: string;
  description?: string | null;
  statut: PtbaStatut;
  annee: number;
  trimestre: number;
  responsableId?: string | null;
  dateDebutPrevue?: Date | null;
  dateFinPrevue?: Date | null;
  dateDebutReelle?: Date | null;
  dateFinReelle?: Date | null;
  montantPrevu?: number | null;
  montantRealise?: number | null;
  tauxRealisation?: number | null;
  createdBy?: string | null;
}

export interface UpdatePtbaActiviteData {
  wbsId?: string | null;
  logframeRefId?: string | null;
  libelle?: string;
  description?: string | null;
  statut?: PtbaStatut;
  annee?: number;
  trimestre?: number;
  responsableId?: string | null;
  dateDebutPrevue?: Date | null;
  dateFinPrevue?: Date | null;
  dateDebutReelle?: Date | null;
  dateFinReelle?: Date | null;
  montantPrevu?: number | null;
  montantRealise?: number | null;
  tauxRealisation?: number | null;
  updatedBy?: string | null;
}

export interface FindPtbaActivitesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  statut?: PtbaStatut;
  annee?: number;
  trimestre?: number;
  wbsId?: string;
  orderBy: Prisma.PtbaActiviteOrderByWithRelationInput;
}

@Injectable()
export class PtbaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindPtbaActivitesParams,
  ): Promise<{ activites: PtbaActivite[]; total: number }> {
    const where = this.buildWhere(params);

    const [activites, total] = await this.prisma.$transaction([
      this.prisma.ptbaActivite.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.ptbaActivite.count({ where }),
    ]);

    return { activites, total };
  }

  findById(id: string): Promise<PtbaActivite | null> {
    return this.prisma.ptbaActivite.findFirst({ where: { id } });
  }

  /** Toutes les activités (non supprimées) d'un projet. */
  findByProject(projectId: string): Promise<PtbaActivite[]> {
    return this.prisma.ptbaActivite.findMany({ where: { project_id: projectId } });
  }

  /** Activités non terminées dont la date de fin prévue est dépassée, triées du plus grand retard. */
  findCriticalByProject(projectId: string): Promise<PtbaActivite[]> {
    const now = new Date();
    return this.prisma.ptbaActivite.findMany({
      where: {
        project_id: projectId,
        statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },
        date_fin_prevue: { lt: now },
      },
      orderBy: { date_fin_prevue: 'asc' },
    });
  }

  create(data: CreatePtbaActiviteData): Promise<PtbaActivite> {
    return this.prisma.ptbaActivite.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId ?? null,
        logframe_ref_id: data.logframeRefId ?? null,
        code: data.code,
        libelle: data.libelle,
        description: data.description ?? null,
        statut: data.statut,
        annee: data.annee,
        trimestre: data.trimestre,
        responsable_id: data.responsableId ?? null,
        date_debut_prevue: data.dateDebutPrevue ?? null,
        date_fin_prevue: data.dateFinPrevue ?? null,
        date_debut_reelle: data.dateDebutReelle ?? null,
        date_fin_reelle: data.dateFinReelle ?? null,
        montant_prevu: data.montantPrevu ?? null,
        montant_realise: data.montantRealise ?? null,
        taux_realisation: data.tauxRealisation ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdatePtbaActiviteData): Promise<PtbaActivite> {
    return this.prisma.ptbaActivite.update({
      where: { id },
      data: {
        wbs_id: data.wbsId,
        logframe_ref_id: data.logframeRefId,
        libelle: data.libelle,
        description: data.description,
        statut: data.statut,
        annee: data.annee,
        trimestre: data.trimestre,
        responsable_id: data.responsableId,
        date_debut_prevue: data.dateDebutPrevue,
        date_fin_prevue: data.dateFinPrevue,
        date_debut_reelle: data.dateDebutReelle,
        date_fin_reelle: data.dateFinReelle,
        montant_prevu: data.montantPrevu,
        montant_realise: data.montantRealise,
        taux_realisation: data.tauxRealisation,
        updated_by: data.updatedBy,
      },
    });
  }

  /**
   * Soft Delete : `.delete()` est intercepté par le middleware et transformé
   * en `update({ deleted_at })`. Aucune suppression physique.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.ptbaActivite.delete({ where: { id } });
  }

  private buildWhere(params: FindPtbaActivitesParams): Prisma.PtbaActiviteWhereInput {
    const where: Prisma.PtbaActiviteWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.annee !== undefined) {
      where.annee = params.annee;
    }
    if (params.trimestre !== undefined) {
      where.trimestre = params.trimestre;
    }
    if (params.wbsId) {
      where.wbs_id = params.wbsId;
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
