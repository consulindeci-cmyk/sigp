import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOperationDto, QueryOperationsDto } from './dto/operation.dto';

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateOperationDto) {
    const tache = await this.prisma.tache.findFirst({
      where: { id: dto.tache_id, projet_id: projectId, deletedAt: null },
    });
    if (!tache) throw new NotFoundException('Tâche introuvable dans ce projet');

    // Créer l'opération
    const operation = await this.prisma.operation.create({
      data: {
        projet_id: projectId,
        tache_id: dto.tache_id,
        date_operation: new Date(dto.date_operation),
        statut: dto.statut,
        montant_engage: dto.montant_engage ?? 0,
        montant_decaisse: dto.montant_decaisse ?? 0,
        commentaire: dto.commentaire,
        cree_par: userId,
      },
    });

    // Mettre à jour le statut et le cout_reel de la tâche liée
    await this.prisma.tache.update({
      where: { id: dto.tache_id },
      data: {
        statut: dto.statut,
        cout_reel: {
          increment: Number(dto.montant_decaisse ?? 0),
        },
      },
    });

    return operation;
  }

  async findAll(projectId: string, query: QueryOperationsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId };
    if (query.tache_id) where.tache_id = query.tache_id;
    if (query.date_debut) where.date_operation = { gte: new Date(query.date_debut) };
    if (query.date_fin) {
      where.date_operation = {
        ...(where.date_operation || {}),
        lte: new Date(query.date_fin),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.operation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_operation: 'desc' },
        include: { tache: { select: { code_tache: true, description: true } } },
      }),
      this.prisma.operation.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.operation.findFirst({
      where: { id, projet_id: projectId },
      include: {
        tache: true,
        createur: { select: { id: true, prenom: true, nom: true, email: true } },
      },
    });
    if (!item) throw new NotFoundException('Opération introuvable');
    return item;
  }

  async findByTask(projectId: string, taskId: string) {
    return this.prisma.operation.findMany({
      where: { projet_id: projectId, tache_id: taskId },
      orderBy: { date_operation: 'desc' },
    });
  }
}
