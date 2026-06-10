import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, QueryUsersDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { prenom: { contains: query.search, mode: 'insensitive' } },
        { nom: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;

    const [data, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          telephone: true,
          role: true,
          actif: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        role: dto.role,
        actif: dto.actif,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }
    await this.findOne(id);
    return this.prisma.utilisateur.update({
      where: { id },
      data: { deletedAt: new Date(), actif: false },
      select: { id: true, email: true, deletedAt: true },
    });
  }
}
