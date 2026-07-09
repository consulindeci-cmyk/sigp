import { Injectable } from '@nestjs/common';
import { Livrable, LivrableStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateLivrableData {
  projectId: string;
  wbsId?: string | null;
  code?: string | null;
  nom: string;
  description?: string | null;
  statut?: LivrableStatus;
  datePrevue?: Date | null;
  dateSoumission?: Date | null;
  dateValidation?: Date | null;
  responsableId?: string | null;
  validateurId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateLivrableData {
  wbsId?: string | null;
  code?: string | null;
  nom?: string;
  description?: string | null;
  statut?: LivrableStatus;
  datePrevue?: Date | null;
  dateSoumission?: Date | null;
  dateValidation?: Date | null;
  responsableId?: string | null;
  validateurId?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
}

export interface FindLivrablesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  statut?: LivrableStatus;
  orderBy: Prisma.LivrableOrderByWithRelationInput;
}

@Injectable()
export class LivrableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindLivrablesParams,
  ): Promise<{ livrables: Livrable[]; total: number }> {
    const where = this.buildWhere(params);

    const [livrables, total] = await this.prisma.$transaction([
      this.prisma.livrable.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.livrable.count({ where }),
    ]);

    return { livrables, total };
  }

  findById(id: string): Promise<Livrable | null> {
    return this.prisma.livrable.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<Livrable[]> {
    return this.prisma.livrable.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateLivrableData): Promise<Livrable> {
    return this.prisma.livrable.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId ?? null,
        code: data.code ?? null,
        nom: data.nom,
        description: data.description ?? null,
        statut: data.statut ?? undefined,
        date_prevue: data.datePrevue ?? null,
        date_soumission: data.dateSoumission ?? null,
        date_validation: data.dateValidation ?? null,
        responsable_id: data.responsableId ?? null,
        validateur_id: data.validateurId ?? null,
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateLivrableData): Promise<Livrable> {
    return this.prisma.livrable.update({
      where: { id },
      data: {
        wbs_id: data.wbsId,
        code: data.code,
        nom: data.nom,
        description: data.description,
        statut: data.statut,
        date_prevue: data.datePrevue,
        date_soumission: data.dateSoumission,
        date_validation: data.dateValidation,
        responsable_id: data.responsableId,
        validateur_id: data.validateurId,
        notes: data.notes,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.livrable.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private buildWhere(params: FindLivrablesParams): Prisma.LivrableWhereInput {
    const where: Prisma.LivrableWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { nom: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
