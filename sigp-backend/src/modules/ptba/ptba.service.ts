import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePtbaDto, UpdatePtbaDto, QueryPtbaDto } from './dto/ptba.dto';

@Injectable()
export class PtbaService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreatePtbaDto) {
    await this.verifyProject(projectId);
    return this.prisma.pTBA.create({
      data: {
        projet_id: projectId,
        code_activite: dto.code_activite,
        composante: dto.composante,
        activite: dto.activite,
        description: dto.description,
        responsable: dto.responsable,
        budget_prevu: dto.budget_prevu,
        q1: dto.q1 ?? 0,
        q2: dto.q2 ?? 0,
        q3: dto.q3 ?? 0,
        q4: dto.q4 ?? 0,
        statut: dto.statut ?? 'PLANIFIE',
        pourcentage_avancement: dto.pourcentage_avancement ?? 0,
      },
    });
  }

  async findAll(projectId: string, query: QueryPtbaDto) {
    await this.verifyProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId, deletedAt: null };
    if (query.statut) where.statut = query.statut;
    if (query.composante) where.composante = { contains: query.composante, mode: 'insensitive' };
    if (query.trimestre) {
      const qField = `q${query.trimestre}`;
      where[qField] = { gt: 0 };
    }

    const [data, total] = await Promise.all([
      this.prisma.pTBA.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.pTBA.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.pTBA.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Activité PTBA introuvable');
    return item;
  }

  async update(projectId: string, id: string, dto: UpdatePtbaDto) {
    await this.findOne(projectId, id);
    return this.prisma.pTBA.update({ where: { id }, data: dto as any });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.pTBA.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async exportByComposante(projectId: string) {
    await this.verifyProject(projectId);
    const items = await this.prisma.pTBA.findMany({
      where: { projet_id: projectId, deletedAt: null },
      orderBy: [{ composante: 'asc' }, { code_activite: 'asc' }],
    });

    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      if (!grouped[item.composante]) grouped[item.composante] = [];
      grouped[item.composante].push(item);
    }

    return {
      projet_id: projectId,
      export_date: new Date().toISOString(),
      composantes: Object.entries(grouped).map(([composante, activites]) => ({
        composante,
        nombre_activites: activites.length,
        budget_total: activites.reduce((s, a) => s + Number(a.budget_prevu), 0),
        activites,
      })),
    };
  }
}
