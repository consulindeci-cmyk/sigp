import { Injectable } from '@nestjs/common';
import { Departement, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateDepartementData {
  directionId: string;
  code: string;
  nom: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateDepartementData {
  nom?: string;
  description?: string | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindDepartementsParams {
  skip: number;
  take: number;
  search?: string;
  directionId?: string;
  actif?: boolean;
  orderBy: Prisma.DepartementOrderByWithRelationInput;
}

@Injectable()
export class DepartementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindDepartementsParams,
  ): Promise<{ departements: Departement[]; total: number }> {
    const where = this.buildWhere(params);

    const [departements, total] = await this.prisma.$transaction([
      this.prisma.departement.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.departement.count({ where }),
    ]);

    return { departements, total };
  }

  findById(id: string): Promise<Departement | null> {
    return this.prisma.departement.findFirst({ where: { id } });
  }

  /** Unicité scopée : code unique au sein d'une direction. */
  findByCode(directionId: string, code: string): Promise<Departement | null> {
    return this.prisma.departement.findFirst({
      where: { direction_id: directionId, code },
    });
  }

  /** Unicité scopée : nom unique au sein d'une direction. */
  findByName(directionId: string, nom: string): Promise<Departement | null> {
    return this.prisma.departement.findFirst({
      where: { direction_id: directionId, nom },
    });
  }

  create(data: CreateDepartementData): Promise<Departement> {
    return this.prisma.departement.create({
      data: {
        direction_id: data.directionId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateDepartementData): Promise<Departement> {
    return this.prisma.departement.update({
      where: { id },
      data: {
        nom: data.nom,
        description: data.description,
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
    await this.prisma.departement.delete({ where: { id } });
  }

  private buildWhere(params: FindDepartementsParams): Prisma.DepartementWhereInput {
    const where: Prisma.DepartementWhereInput = {};

    if (params.directionId) {
      where.direction_id = params.directionId;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
