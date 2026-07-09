import { Injectable } from '@nestjs/common';
import { Prisma, ProjectMember, RoleMembreProjet } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateProjectMemberData {
  projectId: string;
  userId: string;
  role: RoleMembreProjet;
  createdBy?: string | null;
}

export interface UpdateProjectMemberData {
  role?: RoleMembreProjet;
  actif?: boolean;
  updatedBy?: string | null;
}

export interface FindProjectMembersParams {
  skip: number;
  take: number;
  search?: string;
  projectId?: string;
  userId?: string;
  role?: RoleMembreProjet;
  actif?: boolean;
  orderBy: Prisma.ProjectMemberOrderByWithRelationInput;
}

@Injectable()
export class ProjectMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total dans une seule $transaction.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`.
   */
  async findManyPaginated(
    params: FindProjectMembersParams,
  ): Promise<{ members: ProjectMember[]; total: number }> {
    const where = this.buildWhere(params);

    const [members, total] = await this.prisma.$transaction([
      this.prisma.projectMember.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.projectMember.count({ where }),
    ]);

    return { members, total };
  }

  findById(id: string): Promise<ProjectMember | null> {
    return this.prisma.projectMember.findFirst({ where: { id } });
  }

  /** Tous les membres actifs (non supprimés) d'un projet. */
  findByProject(projectId: string): Promise<ProjectMember[]> {
    return this.prisma.projectMember.findMany({ where: { project_id: projectId } });
  }

  /** Toutes les appartenances actives (non supprimées) d'un utilisateur. */
  findByUser(userId: string): Promise<ProjectMember[]> {
    return this.prisma.projectMember.findMany({ where: { user_id: userId } });
  }

  /** Appartenance unique (project_id, user_id) — sert au contrôle d'unicité. */
  findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.prisma.projectMember.findFirst({
      where: { project_id: projectId, user_id: userId },
    });
  }

  create(data: CreateProjectMemberData): Promise<ProjectMember> {
    return this.prisma.projectMember.create({
      data: {
        project_id: data.projectId,
        user_id: data.userId,
        role_projet: data.role,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateProjectMemberData): Promise<ProjectMember> {
    return this.prisma.projectMember.update({
      where: { id },
      data: {
        role_projet: data.role,
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
    await this.prisma.projectMember.delete({ where: { id } });
  }

  private buildWhere(params: FindProjectMembersParams): Prisma.ProjectMemberWhereInput {
    const where: Prisma.ProjectMemberWhereInput = {};

    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.userId) {
      where.user_id = params.userId;
    }
    if (params.role) {
      where.role_projet = params.role;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      // Recherche sur l'utilisateur rattaché (nom, prénom, email), insensible à la casse
      where.user = {
        OR: [
          { nom: { contains: params.search, mode: 'insensitive' } },
          { prenom: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    return where;
  }
}
