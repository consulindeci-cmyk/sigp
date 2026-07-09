import { Injectable } from '@nestjs/common';
import { Direction, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateDirectionData {
  organisationId: string;
  code: string;
  nom: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateDirectionData {
  nom?: string;
  description?: string | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindDirectionsParams {
  skip: number;
  take: number;
  search?: string;
  organisationId?: string;
  actif?: boolean;
  orderBy: Prisma.DirectionOrderByWithRelationInput;
}

@Injectable()
export class DirectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindDirectionsParams,
  ): Promise<{ directions: Direction[]; total: number }> {
    const where = this.buildWhere(params);

    const [directions, total] = await this.prisma.$transaction([
      this.prisma.direction.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.direction.count({ where }),
    ]);

    return { directions, total };
  }

  findById(id: string): Promise<Direction | null> {
    return this.prisma.direction.findFirst({ where: { id } });
  }

  /** Unicité scopée : code unique au sein d'une organisation. */
  findByCode(organisationId: string, code: string): Promise<Direction | null> {
    return this.prisma.direction.findFirst({
      where: { organisation_id: organisationId, code },
    });
  }

  /** Unicité scopée : nom unique au sein d'une organisation. */
  findByName(organisationId: string, nom: string): Promise<Direction | null> {
    return this.prisma.direction.findFirst({
      where: { organisation_id: organisationId, nom },
    });
  }

  create(data: CreateDirectionData): Promise<Direction> {
    return this.prisma.direction.create({
      data: {
        organisation_id: data.organisationId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateDirectionData): Promise<Direction> {
    return this.prisma.direction.update({
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
    await this.prisma.direction.delete({ where: { id } });
  }

  private buildWhere(params: FindDirectionsParams): Prisma.DirectionWhereInput {
    const where: Prisma.DirectionWhereInput = {};

    if (params.organisationId) {
      where.organisation_id = params.organisationId;
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
