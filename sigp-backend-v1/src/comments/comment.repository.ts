import { Injectable } from '@nestjs/common';
import { Comment, Prisma, User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const USER_SELECT = {
  nom: true,
  prenom: true,
  role: true,
  avatar_url: true,
} as const;

export type CommentWithUser = Comment & {
  user: Pick<User, 'nom' | 'prenom' | 'role' | 'avatar_url'>;
};

export interface CreateCommentData {
  projectId: string;
  userId: string;
  parentId?: string | null;
  module?: string | null;
  elementId?: string | null;
  elementNom?: string | null;
  message: string;
  statut?: string;
  priorite?: string;
  pieceJointe?: string | null;
  mention?: string | null;
  lu?: boolean;
}

export interface UpdateCommentData {
  message?: string;
  statut?: string;
  priorite?: string;
  pieceJointe?: string | null;
  mention?: string | null;
  lu?: boolean;
}

export interface FindCommentsParams {
  projectId: string;
  skip: number;
  take: number;
  search?: string;
  statut?: string;
  priorite?: string;
  module?: string;
  userId?: string;
  lu?: boolean;
  orderBy: Prisma.CommentOrderByWithRelationInput;
}

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste paginée + total en une seule $transaction (pas de N+1). */
  async findManyPaginated(
    params: FindCommentsParams,
  ): Promise<{ comments: CommentWithUser[]; total: number }> {
    const where = this.buildWhere(params);

    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { comments: comments as CommentWithUser[], total };
  }

  findById(id: string): Promise<CommentWithUser | null> {
    return this.prisma.comment.findFirst({
      where: { id },
      include: { user: { select: USER_SELECT } },
    }) as Promise<CommentWithUser | null>;
  }

  create(data: CreateCommentData): Promise<CommentWithUser> {
    return this.prisma.comment.create({
      data: {
        project_id: data.projectId,
        user_id: data.userId,
        parent_id: data.parentId ?? null,
        module: data.module ?? null,
        element_id: data.elementId ?? null,
        element_nom: data.elementNom ?? null,
        message: data.message,
        statut: data.statut ?? 'OUVERT',
        priorite: data.priorite ?? 'NORMALE',
        piece_jointe: data.pieceJointe ?? null,
        mention: data.mention ?? null,
        lu: data.lu ?? false,
      },
      include: { user: { select: USER_SELECT } },
    }) as Promise<CommentWithUser>;
  }

  update(id: string, data: UpdateCommentData): Promise<CommentWithUser> {
    return this.prisma.comment.update({
      where: { id },
      data: {
        message: data.message,
        statut: data.statut,
        priorite: data.priorite,
        piece_jointe: data.pieceJointe,
        mention: data.mention,
        lu: data.lu,
      },
      include: { user: { select: USER_SELECT } },
    }) as Promise<CommentWithUser>;
  }

  /** Soft Delete via le middleware (`.delete()` → `update({ deleted_at })`). */
  async softDelete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  private buildWhere(params: FindCommentsParams): Prisma.CommentWhereInput {
    const where: Prisma.CommentWhereInput = { project_id: params.projectId };

    if (params.statut) where.statut = params.statut;
    if (params.priorite) where.priorite = params.priorite;
    if (params.module) where.module = params.module;
    if (params.userId) where.user_id = params.userId;
    if (params.lu !== undefined) where.lu = params.lu;

    if (params.search) {
      where.OR = [
        { message: { contains: params.search, mode: 'insensitive' } },
        { element_nom: { contains: params.search, mode: 'insensitive' } },
        { mention: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
