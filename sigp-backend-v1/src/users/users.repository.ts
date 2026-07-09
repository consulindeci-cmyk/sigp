import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: UserRole;
  telephone?: string | null;
}

export interface UpdateUserData {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  role?: UserRole;
  actif?: boolean;
}

export interface FindUsersParams {
  skip: number;
  take: number;
  search?: string;
  role?: UserRole;
  actif?: boolean;
  orderBy: Prisma.UserOrderByWithRelationInput;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée + total.
   * Le middleware Soft Delete injecte automatiquement `deleted_at: null`
   * sur findMany et count : les utilisateurs supprimés sont exclus.
   */
  async findManyPaginated(params: FindUsersParams): Promise<{ users: User[]; total: number }> {
    const where = this.buildWhere(params);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /** Recherche par id (les utilisateurs soft-deleted sont exclus par le middleware). */
  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id } });
  }

  /** Recherche par email — sert au contrôle d'unicité avant création. */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        mot_de_passe: data.motDePasse,
        role: data.role,
        telephone: data.telephone ?? null,
      },
    });
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: data.role,
        actif: data.actif,
      },
    });
  }

  /**
   * Soft Delete : `.delete()` est intercepté par le middleware et transformé
   * en `update({ deleted_at })`. Aucune suppression physique.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private buildWhere(params: FindUsersParams): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (params.role) {
      where.role = params.role;
    }
    if (params.actif !== undefined) {
      where.actif = params.actif;
    }
    if (params.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { prenom: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
