import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto/task.dto';
import { StatutTache } from '@prisma/client';
import { LedgerService } from '../projects/ledger.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  private computeFields(task: any) {
    const coutPrevu = Number(task.cout_prevu);
    const coutReel = Number(task.cout_reel);
    return {
      ...task,
      reste_a_engager: task.statut === StatutTache.A_FAIRE ? coutPrevu : 0,
      montant_engage: task.statut === StatutTache.EN_COURS ? coutPrevu : 0,
      montant_decaisse: task.statut === StatutTache.TERMINE ? coutReel : 0,
      ecart_budgetaire: task.statut === StatutTache.TERMINE ? coutPrevu - coutReel : 0,
    };
  }

  async create(projectId: string, dto: CreateTaskDto, userId: string) {
    await this.verifyProject(projectId);
    
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.tache.create({
        data: {
          projet_id: projectId,
          wbs_id: dto.wbs_id,
          ligne_budgetaire_id: dto.ligne_budgetaire_id,
          code_tache: dto.code_tache,
          description: dto.description,
          responsable: dto.responsable,
          date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
          date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
          cout_prevu: dto.cout_prevu,
          cout_reel: dto.cout_reel ?? 0,
          avancement: dto.avancement ?? 0,
          statut: dto.statut ?? StatutTache.A_FAIRE,
        },
      });

      // Log Outbox si la tâche est créée directement avec un statut impliquant des finances
      if (task.statut === StatutTache.EN_COURS || task.statut === StatutTache.TERMINE) {
        await this.ledgerService.dispatchToOutbox(tx, {
          aggregateType: 'TACHE',
          aggregateId: task.id,
          eventType: task.statut === StatutTache.TERMINE ? 'DECAISSEMENT' : 'ENGAGEMENT_BUDGETAIRE',
          auteur_id: userId,
          payload: {
            projet_id: task.projet_id,
            entite_type: 'TACHE',
            montant_engage: task.statut === StatutTache.EN_COURS ? task.cout_prevu : 0,
            montant_decaisse: task.statut === StatutTache.TERMINE ? task.cout_reel : 0,
            description: `Tâche créée au statut ${task.statut}: ${task.description}`,
            snapshot: { ...task }
          }
        });
      }

      return this.computeFields(task);
    });
  }

  async findAll(projectId: string, query: QueryTasksDto) {
    await this.verifyProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId, deletedAt: null };
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { code_tache: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.statut) where.statut = query.statut;
    if (query.wbs_id) where.wbs_id = query.wbs_id;
    if (query.responsable) where.responsable = { contains: query.responsable, mode: 'insensitive' };
    if (query.date_debut) where.date_debut = { gte: new Date(query.date_debut) };
    if (query.date_fin) where.date_fin = { lte: new Date(query.date_fin) };

    const [tasks, total] = await Promise.all([
      this.prisma.tache.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: { wbs: true },
      }),
      this.prisma.tache.count({ where }),
    ]);

    return {
      data: tasks.map((t) => this.computeFields(t)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(projectId: string, id: string) {
    const task = await this.prisma.tache.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
      include: { wbs: true, ligneBudgetaire: true },
    });
    if (!task) throw new NotFoundException('Tâche introuvable');
    return this.computeFields(task);
  }

  async update(projectId: string, id: string, dto: UpdateTaskDto, userId: string) {
    const oldTask = await this.findOne(projectId, id);
    
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tache.update({
        where: { id },
        data: {
          wbs_id: dto.wbs_id,
          ligne_budgetaire_id: dto.ligne_budgetaire_id,
          description: dto.description,
          responsable: dto.responsable,
          date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
          date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
          cout_prevu: dto.cout_prevu,
          cout_reel: dto.cout_reel,
          avancement: dto.avancement,
          statut: dto.statut,
        },
      });

      // Gestion des transitions de statut pour le Ledger
      if (dto.statut && dto.statut !== oldTask.statut) {
        if (dto.statut === StatutTache.EN_COURS) {
          await this.ledgerService.dispatchToOutbox(tx, {
            aggregateType: 'TACHE',
            aggregateId: updated.id,
            eventType: 'ENGAGEMENT_BUDGETAIRE',
            auteur_id: userId,
            payload: {
              projet_id: updated.projet_id,
              entite_type: 'TACHE',
              montant_engage: updated.cout_prevu,
              montant_decaisse: 0,
              description: `Engagement de la tâche: ${updated.description}`,
              snapshot: { ...updated }
            }
          });
        } else if (dto.statut === StatutTache.TERMINE) {
          await this.ledgerService.dispatchToOutbox(tx, {
            aggregateType: 'TACHE',
            aggregateId: updated.id,
            eventType: 'DECAISSEMENT', // Ou CLOTURE_TACHE
            auteur_id: userId,
            payload: {
              projet_id: updated.projet_id,
              entite_type: 'TACHE',
              montant_engage: 0,
              montant_decaisse: updated.cout_reel,
              description: `Décaissement sur tâche: ${updated.description}`,
              snapshot: { ...updated }
            }
          });
        }
      } else if (oldTask.statut === StatutTache.TERMINE && dto.cout_reel && Number(dto.cout_reel) !== Number(oldTask.cout_reel)) {
        // Ajustement financier si la tâche était déjà terminée
        const difference = Number(dto.cout_reel) - Number(oldTask.cout_reel);
        await this.ledgerService.dispatchToOutbox(tx, {
          aggregateType: 'TACHE',
          aggregateId: updated.id,
          eventType: 'DECAISSEMENT',
          auteur_id: userId,
          payload: {
            projet_id: updated.projet_id,
            entite_type: 'TACHE',
            montant_engage: 0,
            montant_decaisse: difference,
            description: `Ajustement financier de tâche: ${updated.description}`,
            snapshot: { ...updated }
          }
        });
      }

      return this.computeFields(updated);
    });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.tache.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async findByWbs(projectId: string, wbsId: string) {
    await this.verifyProject(projectId);
    const tasks = await this.prisma.tache.findMany({
      where: { projet_id: projectId, wbs_id: wbsId, deletedAt: null },
      orderBy: { code_tache: 'asc' },
    });
    return tasks.map((t) => this.computeFields(t));
  }
}
