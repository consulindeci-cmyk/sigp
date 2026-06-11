import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  QueryProcurementDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreateProcurementDto) {
    await this.verifyProject(projectId);
    return this.prisma.marche.create({
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

  async update(projectId: string, id: string, dto: UpdateProcurementDto) {
    await this.findOne(projectId, id);
    return this.prisma.marche.update({
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
