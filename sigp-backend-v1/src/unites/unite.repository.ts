import { Injectable } from '@nestjs/common';
import { Prisma, Unite } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateUniteData {
  departementId: string;
  code: string;
  nom: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateUniteData {
  nom?: string;
  description?: string | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindUnitesParams {
  skip: number;
  take: number;
  search?: string;
  departementId?: string;
  actif?: boolean;
  orderBy: Prisma.UniteOrderByWithRelationInput;
}

@Injectable()
export class UniteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(params: FindUnitesParams): Promise<{ unites: Unite[]; total: number }> {
    const where = this.buildWhere(params);

    const [unites, total] = await this.prisma.$transaction([
      this.prisma.unite.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.unite.count({ where }),
    ]);

    return { unites, total };
  }

  findById(id: string): Promise<Unite | null> {
    return this.prisma.unite.findFirst({ where: { id } });
  }

  /** Unicité scopée : code unique au sein d'un département. */
  findByCode(departementId: string, code: string): Promise<Unite | null> {
    return this.prisma.unite.findFirst({
      where: { departement_id: departementId, code },
    });
  }

  /** Unicité scopée : nom unique au sein d'un département. */
  findByName(departementId: string, nom: string): Promise<Unite | null> {
    return this.prisma.unite.findFirst({
      where: { departement_id: departementId, nom },
    });
  }

  create(data: CreateUniteData): Promise<Unite> {
    return this.prisma.unite.create({
      data: {
        departement_id: data.departementId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateUniteData): Promise<Unite> {
    return this.prisma.unite.update({
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
    await this.prisma.unite.delete({ where: { id } });
  }

  private buildWhere(params: FindUnitesParams): Prisma.UniteWhereInput {
    const where: Prisma.UniteWhereInput = {};

    if (params.departementId) {
      where.departement_id = params.departementId;
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
