import { Injectable } from '@nestjs/common';
import { FormatRapport, Prisma, RapportProjet, StatutRapport, TypeRapport } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateReportData {
  projectId: string;
  codeRapport: string;
  titre: string;
  description?: string | null;
  type: TypeRapport;
  format: FormatRapport;
  statut?: StatutRapport;
  periode: string;
  dateGeneration: Date;
  dateTelechargement?: Date | null;
  version: string;
  auteur: string;
  tailleKo?: number;
  nbTelechargements?: number;
  commentaires?: string | null;
  createdBy?: string | null;
}

export interface UpdateReportData {
  codeRapport?: string;
  titre?: string;
  description?: string | null;
  type?: TypeRapport;
  format?: FormatRapport;
  statut?: StatutRapport;
  periode?: string;
  dateGeneration?: Date;
  dateTelechargement?: Date | null;
  version?: string;
  auteur?: string;
  tailleKo?: number;
  nbTelechargements?: number;
  commentaires?: string | null;
  updatedBy?: string | null;
}

export interface FindReportsParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  type?: TypeRapport;
  format?: FormatRapport;
  statut?: StatutRapport;
  orderBy: Prisma.RapportProjetOrderByWithRelationInput;
}

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindReportsParams,
  ): Promise<{ reports: RapportProjet[]; total: number }> {
    const where = this.buildWhere(params);

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.rapportProjet.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.rapportProjet.count({ where }),
    ]);

    return { reports, total };
  }

  findById(id: string): Promise<RapportProjet | null> {
    return this.prisma.rapportProjet.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<RapportProjet[]> {
    return this.prisma.rapportProjet.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateReportData): Promise<RapportProjet> {
    return this.prisma.rapportProjet.create({
      data: {
        project_id: data.projectId,
        code_rapport: data.codeRapport,
        titre: data.titre,
        description: data.description ?? null,
        type: data.type,
        format: data.format,
        statut: data.statut ?? undefined,
        periode: data.periode,
        date_generation: data.dateGeneration,
        date_telechargement: data.dateTelechargement ?? null,
        version: data.version,
        auteur: data.auteur,
        taille_ko: data.tailleKo ?? 0,
        nb_telechargements: data.nbTelechargements ?? 0,
        commentaires: data.commentaires ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateReportData): Promise<RapportProjet> {
    return this.prisma.rapportProjet.update({
      where: { id },
      data: {
        code_rapport: data.codeRapport,
        titre: data.titre,
        description: data.description,
        type: data.type,
        format: data.format,
        statut: data.statut,
        periode: data.periode,
        date_generation: data.dateGeneration,
        date_telechargement: data.dateTelechargement,
        version: data.version,
        auteur: data.auteur,
        taille_ko: data.tailleKo,
        nb_telechargements: data.nbTelechargements,
        commentaires: data.commentaires,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.rapportProjet.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private buildWhere(params: FindReportsParams): Prisma.RapportProjetWhereInput {
    const where: Prisma.RapportProjetWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.format) {
      where.format = params.format;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { titre: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { auteur: { contains: params.search, mode: 'insensitive' } },
        { code_rapport: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
