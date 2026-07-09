import { Injectable } from '@nestjs/common';
import { Organisation, OrganisationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateOrganisationData {
  code: string;
  nom: string;
  type: OrganisationType;
  description?: string | null;
  email?: string | null;
  telephone?: string | null;
  siteWeb?: string | null;
  createdBy?: string | null;
}

export interface UpdateOrganisationData {
  nom?: string;
  type?: OrganisationType;
  description?: string | null;
  email?: string | null;
  telephone?: string | null;
  siteWeb?: string | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindOrganisationsParams {
  skip: number;
  take: number;
  search?: string;
  type?: OrganisationType;
  actif?: boolean;
  orderBy: Prisma.OrganisationOrderByWithRelationInput;
}

@Injectable()
export class OrganisationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindOrganisationsParams,
  ): Promise<{ organisations: Organisation[]; total: number }> {
    const where = this.buildWhere(params);

    const [organisations, total] = await this.prisma.$transaction([
      this.prisma.organisation.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.organisation.count({ where }),
    ]);

    return { organisations, total };
  }

  findById(id: string): Promise<Organisation | null> {
    return this.prisma.organisation.findFirst({ where: { id } });
  }

  findByCode(code: string): Promise<Organisation | null> {
    return this.prisma.organisation.findFirst({ where: { code } });
  }

  findByName(nom: string): Promise<Organisation | null> {
    return this.prisma.organisation.findFirst({ where: { nom } });
  }

  create(data: CreateOrganisationData): Promise<Organisation> {
    return this.prisma.organisation.create({
      data: {
        code: data.code,
        nom: data.nom,
        type: data.type,
        description: data.description ?? null,
        email: data.email ?? null,
        telephone: data.telephone ?? null,
        site_web: data.siteWeb ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateOrganisationData): Promise<Organisation> {
    return this.prisma.organisation.update({
      where: { id },
      data: {
        nom: data.nom,
        type: data.type,
        description: data.description,
        email: data.email,
        telephone: data.telephone,
        site_web: data.siteWeb,
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
    await this.prisma.organisation.delete({ where: { id } });
  }

  private buildWhere(params: FindOrganisationsParams): Prisma.OrganisationWhereInput {
    const where: Prisma.OrganisationWhereInput = {};

    if (params.type) {
      where.type = params.type;
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
