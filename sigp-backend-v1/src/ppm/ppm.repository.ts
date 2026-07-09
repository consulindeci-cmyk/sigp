import { Injectable } from '@nestjs/common';
import { PpmMarche, PpmMarcheStatus, PpmTypeMarche, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreatePpmMarcheData {
  projectId: string;
  code: string;
  intitule: string;
  type: PpmTypeMarche;
  statut?: PpmMarcheStatus;
  montantEstime?: number | null;
  montantSigne?: number | null;
  dateLancementPrevu?: Date | null;
  dateSoumissionPrevu?: Date | null;
  dateAttribution?: Date | null;
  dateSignature?: Date | null;
  dateFinPrevue?: Date | null;
  dateFinEffective?: Date | null;
  titulaire?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdatePpmMarcheData {
  code?: string;
  intitule?: string;
  type?: PpmTypeMarche;
  statut?: PpmMarcheStatus;
  montantEstime?: number | null;
  montantSigne?: number | null;
  dateLancementPrevu?: Date | null;
  dateSoumissionPrevu?: Date | null;
  dateAttribution?: Date | null;
  dateSignature?: Date | null;
  dateFinPrevue?: Date | null;
  dateFinEffective?: Date | null;
  titulaire?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
}

export interface FindPpmMarchesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  type?: PpmTypeMarche;
  statut?: PpmMarcheStatus;
  orderBy: Prisma.PpmMarcheOrderByWithRelationInput;
}

@Injectable()
export class PpmRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindPpmMarchesParams,
  ): Promise<{ marches: PpmMarche[]; total: number }> {
    const where = this.buildWhere(params);

    const [marches, total] = await this.prisma.$transaction([
      this.prisma.ppmMarche.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.ppmMarche.count({ where }),
    ]);

    return { marches, total };
  }

  findById(id: string): Promise<PpmMarche | null> {
    return this.prisma.ppmMarche.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<PpmMarche[]> {
    return this.prisma.ppmMarche.findMany({ where: { project_id: projectId } });
  }

  create(data: CreatePpmMarcheData): Promise<PpmMarche> {
    return this.prisma.ppmMarche.create({
      data: {
        project_id: data.projectId,
        code: data.code,
        intitule: data.intitule,
        type: data.type,
        statut: data.statut,
        montant_estime: data.montantEstime ?? null,
        montant_signe: data.montantSigne ?? null,
        date_lancement_prevu: data.dateLancementPrevu ?? null,
        date_soumission_prevu: data.dateSoumissionPrevu ?? null,
        date_attribution: data.dateAttribution ?? null,
        date_signature: data.dateSignature ?? null,
        date_fin_prevue: data.dateFinPrevue ?? null,
        date_fin_effective: data.dateFinEffective ?? null,
        titulaire: data.titulaire ?? null,
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdatePpmMarcheData): Promise<PpmMarche> {
    return this.prisma.ppmMarche.update({
      where: { id },
      data: {
        code: data.code,
        intitule: data.intitule,
        type: data.type,
        statut: data.statut,
        montant_estime: data.montantEstime,
        montant_signe: data.montantSigne,
        date_lancement_prevu: data.dateLancementPrevu,
        date_soumission_prevu: data.dateSoumissionPrevu,
        date_attribution: data.dateAttribution,
        date_signature: data.dateSignature,
        date_fin_prevue: data.dateFinPrevue,
        date_fin_effective: data.dateFinEffective,
        titulaire: data.titulaire,
        notes: data.notes,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.ppmMarche.delete({ where: { id } });
  }

  private buildWhere(params: FindPpmMarchesParams): Prisma.PpmMarcheWhereInput {
    const where: Prisma.PpmMarcheWhereInput = {};

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
        { code: { contains: params.search, mode: 'insensitive' } },
        { intitule: { contains: params.search, mode: 'insensitive' } },
        { titulaire: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
