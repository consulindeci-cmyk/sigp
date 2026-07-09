import { Injectable } from '@nestjs/common';
import { PpmEtape, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreatePpmEtapeData {
  marcheId: string;
  libelle: string;
  ordre: number;
  datePrevue?: Date | null;
  dateReelle?: Date | null;
  complete?: boolean;
  notes?: string | null;
}

export interface UpdatePpmEtapeData {
  libelle?: string;
  ordre?: number;
  datePrevue?: Date | null;
  dateReelle?: Date | null;
  complete?: boolean;
  notes?: string | null;
}

export interface FindPpmEtapesParams {
  skip: number;
  take: number;
  search?: string;
  marcheId?: string;
  complete?: boolean;
  orderBy: Prisma.PpmEtapeOrderByWithRelationInput;
}

@Injectable()
export class PpmEtapeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindPpmEtapesParams,
  ): Promise<{ etapes: PpmEtape[]; total: number }> {
    const where = this.buildWhere(params);

    const [etapes, total] = await this.prisma.$transaction([
      this.prisma.ppmEtape.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.ppmEtape.count({ where }),
    ]);

    return { etapes, total };
  }

  findById(id: string): Promise<PpmEtape | null> {
    return this.prisma.ppmEtape.findFirst({ where: { id } });
  }

  findByPpmMarche(marcheId: string): Promise<PpmEtape[]> {
    return this.prisma.ppmEtape.findMany({ where: { marche_id: marcheId } });
  }

  create(data: CreatePpmEtapeData): Promise<PpmEtape> {
    return this.prisma.ppmEtape.create({
      data: {
        marche_id: data.marcheId,
        libelle: data.libelle,
        ordre: data.ordre,
        date_prevue: data.datePrevue ?? null,
        date_reelle: data.dateReelle ?? null,
        complete: data.complete ?? false,
        notes: data.notes ?? null,
      },
    });
  }

  update(id: string, data: UpdatePpmEtapeData): Promise<PpmEtape> {
    return this.prisma.ppmEtape.update({
      where: { id },
      data: {
        libelle: data.libelle,
        ordre: data.ordre,
        date_prevue: data.datePrevue,
        date_reelle: data.dateReelle,
        complete: data.complete,
        notes: data.notes,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.ppmEtape.delete({ where: { id } });
  }

  private buildWhere(params: FindPpmEtapesParams): Prisma.PpmEtapeWhereInput {
    const where: Prisma.PpmEtapeWhereInput = {};

    if (params.marcheId) {
      where.marche_id = params.marcheId;
    }
    if (params.complete !== undefined) {
      where.complete = params.complete;
    }
    if (params.search) {
      where.OR = [
        { libelle: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
