import { Injectable } from '@nestjs/common';
import { DocumentProjet, DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateDocumentData {
  projectId: string;
  livrableId?: string | null;
  titre: string;
  description?: string | null;
  statut?: DocumentStatus;
  createdBy?: string | null;
}

export interface UpdateDocumentData {
  livrableId?: string | null;
  titre?: string;
  description?: string | null;
  statut?: DocumentStatus;
  updatedBy?: string | null;
}

export interface FindDocumentsParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  livrableId?: string;
  statut?: DocumentStatus;
  orderBy: Prisma.DocumentProjetOrderByWithRelationInput;
}

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindDocumentsParams,
  ): Promise<{ documents: DocumentProjet[]; total: number }> {
    const where = this.buildWhere(params);

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.documentProjet.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.documentProjet.count({ where }),
    ]);

    return { documents, total };
  }

  findById(id: string): Promise<DocumentProjet | null> {
    return this.prisma.documentProjet.findFirst({ where: { id } });
  }

  findByProject(projectId: string): Promise<DocumentProjet[]> {
    return this.prisma.documentProjet.findMany({ where: { project_id: projectId } });
  }

  create(data: CreateDocumentData): Promise<DocumentProjet> {
    return this.prisma.documentProjet.create({
      data: {
        project_id: data.projectId,
        livrable_id: data.livrableId ?? null,
        titre: data.titre,
        description: data.description ?? null,
        statut: data.statut ?? undefined,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateDocumentData): Promise<DocumentProjet> {
    return this.prisma.documentProjet.update({
      where: { id },
      data: {
        livrable_id: data.livrableId,
        titre: data.titre,
        description: data.description,
        statut: data.statut,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.documentProjet.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private buildWhere(params: FindDocumentsParams): Prisma.DocumentProjetWhereInput {
    const where: Prisma.DocumentProjetWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.livrableId) {
      where.livrable_id = params.livrableId;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.search) {
      where.OR = [
        { titre: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
