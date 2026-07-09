import { Injectable } from '@nestjs/common';
import { Prisma, Programme, ProgrammeStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateProgrammeData {
  uniteId: string;
  code: string;
  nom: string;
  description?: string | null;
  statut: ProgrammeStatus;
  createdBy?: string | null;
}

export interface UpdateProgrammeData {
  nom?: string;
  description?: string | null;
  statut?: ProgrammeStatus;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindProgrammesParams {
  skip: number;
  take: number;
  search?: string;
  uniteId?: string;
  statut?: ProgrammeStatus;
  actif?: boolean;
  orderBy: Prisma.ProgrammeOrderByWithRelationInput;
}

@Injectable()
export class ProgrammeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindProgrammesParams,
  ): Promise<{ programmes: Programme[]; total: number }> {
    const where = this.buildWhere(params);

    const [programmes, total] = await this.prisma.$transaction([
      this.prisma.programme.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.programme.count({ where }),
    ]);

    return { programmes, total };
  }

  findById(id: string): Promise<Programme | null> {
    return this.prisma.programme.findFirst({ where: { id } });
  }

  /** Unicité scopée : code unique au sein d'une unité. */
  findByCode(uniteId: string, code: string): Promise<Programme | null> {
    return this.prisma.programme.findFirst({
      where: { unite_id: uniteId, code },
    });
  }

  /** Unicité scopée : nom unique au sein d'une unité. */
  findByName(uniteId: string, nom: string): Promise<Programme | null> {
    return this.prisma.programme.findFirst({
      where: { unite_id: uniteId, nom },
    });
  }

  create(data: CreateProgrammeData): Promise<Programme> {
    return this.prisma.programme.create({
      data: {
        unite_id: data.uniteId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        statut: data.statut,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateProgrammeData): Promise<Programme> {
    return this.prisma.programme.update({
      where: { id },
      data: {
        nom: data.nom,
        description: data.description,
        statut: data.statut,
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
    await this.prisma.programme.delete({ where: { id } });
  }

  private buildWhere(params: FindProgrammesParams): Prisma.ProgrammeWhereInput {
    const where: Prisma.ProgrammeWhereInput = {};

    if (params.uniteId) {
      where.unite_id = params.uniteId;
    }
    if (params.statut) {
      where.statut = params.statut;
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
