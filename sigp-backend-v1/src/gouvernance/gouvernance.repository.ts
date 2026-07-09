import { Injectable } from '@nestjs/common';
import { Gouvernance, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateGouvernanceData {
  projectId: string;
  nom: string;
  role: string;
  organisation?: string | null;
  email?: string | null;
  telephone?: string | null;
  userId?: string | null;
  createdBy?: string | null;
}

export interface UpdateGouvernanceData {
  nom?: string;
  role?: string;
  organisation?: string | null;
  email?: string | null;
  telephone?: string | null;
  userId?: string | null;
  updatedBy?: string | null;
}

export interface FindGouvernanceParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  userId?: string;
  orderBy: Prisma.GouvernanceOrderByWithRelationInput;
}

@Injectable()
export class GouvernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindGouvernanceParams,
  ): Promise<{ entries: Gouvernance[]; total: number }> {
    const where = this.buildWhere(params);

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.gouvernance.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.gouvernance.count({ where }),
    ]);

    return { entries, total };
  }

  findById(id: string): Promise<Gouvernance | null> {
    return this.prisma.gouvernance.findFirst({ where: { id } });
  }

  /** Toutes les entrées de gouvernance d'un projet. */
  findByProject(projectId: string): Promise<Gouvernance[]> {
    return this.prisma.gouvernance.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateGouvernanceData): Promise<Gouvernance> {
    return this.prisma.gouvernance.create({
      data: {
        project_id: data.projectId,
        nom: data.nom,
        role: data.role,
        organisation: data.organisation ?? null,
        email: data.email ?? null,
        telephone: data.telephone ?? null,
        user_id: data.userId ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateGouvernanceData): Promise<Gouvernance> {
    return this.prisma.gouvernance.update({
      where: { id },
      data: {
        nom: data.nom,
        role: data.role,
        organisation: data.organisation,
        email: data.email,
        telephone: data.telephone,
        user_id: data.userId,
        updated_by: data.updatedBy,
      },
    });
  }

  /**
   * Soft Delete : `.delete()` est intercepté par le middleware et transformé
   * en `update({ deleted_at })`. Aucune suppression physique.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.gouvernance.delete({ where: { id } });
  }

  private buildWhere(params: FindGouvernanceParams): Prisma.GouvernanceWhereInput {
    const where: Prisma.GouvernanceWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.userId) {
      where.user_id = params.userId;
    }
    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { role: { contains: params.search, mode: 'insensitive' } },
        { organisation: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
