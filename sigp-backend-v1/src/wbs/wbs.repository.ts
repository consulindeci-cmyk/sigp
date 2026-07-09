import { Injectable } from '@nestjs/common';
import { Prisma, WbsNode, WbsNodeType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateWbsNodeData {
  projectId: string;
  parentId?: string | null;
  objectiveId?: string | null;
  code: string;
  libelle: string;
  type: WbsNodeType;
  niveau: number;
  ordre?: number;
  responsableId?: string | null;
  dateDebut?: Date | null;
  dateFin?: Date | null;
  createdBy?: string | null;
}

export interface UpdateWbsNodeData {
  parentId?: string | null;
  objectiveId?: string | null;
  libelle?: string;
  type?: WbsNodeType;
  niveau?: number;
  ordre?: number;
  responsableId?: string | null;
  dateDebut?: Date | null;
  dateFin?: Date | null;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindWbsNodesParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  parentId?: string;
  objectiveId?: string;
  type?: WbsNodeType;
  actif?: boolean;
  orderBy: Prisma.WbsNodeOrderByWithRelationInput;
}

@Injectable()
export class WbsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindWbsNodesParams,
  ): Promise<{ nodes: WbsNode[]; total: number }> {
    const where = this.buildWhere(params);

    const [nodes, total] = await this.prisma.$transaction([
      this.prisma.wbsNode.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.wbsNode.count({ where }),
    ]);

    return { nodes, total };
  }

  findById(id: string): Promise<WbsNode | null> {
    return this.prisma.wbsNode.findFirst({ where: { id } });
  }

  /** Tous les nœuds (non supprimés) d'un projet. */
  findByProject(projectId: string): Promise<WbsNode[]> {
    return this.prisma.wbsNode.findMany({ where: { project_id: projectId } });
  }

  /** Enfants directs (non supprimés) d'un nœud. */
  findChildren(parentId: string): Promise<WbsNode[]> {
    return this.prisma.wbsNode.findMany({ where: { parent_id: parentId } });
  }

  create(data: CreateWbsNodeData): Promise<WbsNode> {
    return this.prisma.wbsNode.create({
      data: {
        project_id: data.projectId,
        parent_id: data.parentId ?? null,
        objective_id: data.objectiveId ?? null,
        code: data.code,
        libelle: data.libelle,
        type: data.type,
        niveau: data.niveau,
        ordre: data.ordre ?? 0,
        responsable_id: data.responsableId ?? null,
        date_debut: data.dateDebut ?? null,
        date_fin: data.dateFin ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateWbsNodeData): Promise<WbsNode> {
    return this.prisma.wbsNode.update({
      where: { id },
      data: {
        parent_id: data.parentId,
        objective_id: data.objectiveId,
        libelle: data.libelle,
        type: data.type,
        niveau: data.niveau,
        ordre: data.ordre,
        responsable_id: data.responsableId,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
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
    await this.prisma.wbsNode.delete({ where: { id } });
  }

  private buildWhere(params: FindWbsNodesParams): Prisma.WbsNodeWhereInput {
    const where: Prisma.WbsNodeWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.parentId) {
      where.parent_id = params.parentId;
    }
    if (params.objectiveId) {
      where.objective_id = params.objectiveId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { libelle: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
