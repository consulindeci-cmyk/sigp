import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  QueryProcurementDto,
} from './dto/procurement.dto';
import { LedgerService } from '../projects/ledger.service';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreateProcurementDto, userId: string) {
    await this.verifyProject(projectId);
    
    return this.prisma.$transaction(async (tx) => {
      const marche = await tx.marche.create({
        data: {
          projet_id: projectId,
          description_marche: dto.description_marche,
          type_marche: dto.type_marche,
          methode: dto.methode,
          type_revue: dto.type_revue,
          date_prevue: dto.date_prevue ? new Date(dto.date_prevue) : undefined,
          date_signature: dto.date_signature ? new Date(dto.date_signature) : undefined,
          montant_estime: dto.montant_estime,
          statut: dto.statut ?? 'PLANIFIE',
        },
      });

      const snapshot = { ...marche };

      await this.ledgerService.dispatchToOutbox(tx, {
        aggregateType: 'MARCHE',
        aggregateId: marche.id,
        eventType: 'CREATION_MARCHE',
        auteur_id: userId,
        payload: {
          projet_id: marche.projet_id,
          entite_type: 'MARCHE',
          montant_engage: 0,
          montant_decaisse: 0,
          description: `Création du marché: ${marche.description_marche}`,
          snapshot: snapshot
        }
      });

      return marche;
    });
  }

  async findAll(projectId: string, query: QueryProcurementDto) {
    await this.verifyProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId, deletedAt: null };
    if (query.type_marche) where.type_marche = query.type_marche;
    if (query.methode) where.methode = query.methode;
    if (query.statut) where.statut = query.statut;

    const [data, total] = await Promise.all([
      this.prisma.marche.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy ?? 'date_prevue']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.marche.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.marche.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Marché introuvable');
    return item;
  }

  async update(projectId: string, id: string, dto: UpdateProcurementDto, userId: string) {
    const oldMarche = await this.findOne(projectId, id);
    
    return this.prisma.$transaction(async (tx) => {
      const marche = await tx.marche.update({
        where: { id },
        data: {
          description_marche: dto.description_marche,
          type_marche: dto.type_marche,
          methode: dto.methode,
          type_revue: dto.type_revue,
          date_prevue: dto.date_prevue ? new Date(dto.date_prevue) : undefined,
          date_signature: dto.date_signature ? new Date(dto.date_signature) : undefined,
          montant_estime: dto.montant_estime,
          statut: dto.statut,
        },
      });

      // Si le statut passe à SIGNE, on enregistre un engagement financier
      if (dto.statut === 'SIGNE' && oldMarche.statut !== 'SIGNE') {
        await this.ledgerService.dispatchToOutbox(tx, {
          aggregateType: 'MARCHE',
          aggregateId: marche.id,
          eventType: 'ENGAGEMENT_BUDGETAIRE',
          auteur_id: userId,
          payload: {
            projet_id: marche.projet_id,
            entite_type: 'MARCHE',
            montant_engage: marche.montant_estime,
            montant_decaisse: 0,
            description: `Signature du marché: ${marche.description_marche}`,
            snapshot: { ...marche }
          }
        });
      }

      return marche;
    });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.marche.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async getCalendar(projectId: string) {
    await this.verifyProject(projectId);
    return this.prisma.marche.findMany({
      where: { projet_id: projectId, deletedAt: null, date_prevue: { not: null } },
      orderBy: { date_prevue: 'asc' },
      select: {
        id: true,
        description_marche: true,
        type_marche: true,
        methode: true,
        date_prevue: true,
        date_signature: true,
        montant_estime: true,
        statut: true,
      },
    });
  }
}
