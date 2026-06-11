import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRiskDto, UpdateRiskDto, QueryRisksDto } from './dto/risk.dto';

@Injectable()
export class RisksService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  private getNiveauCriticite(criticite: number): string {
    if (criticite <= 2) return 'FAIBLE';
    if (criticite <= 4) return 'MOYEN';
    if (criticite <= 6) return 'ELEVE';
    return 'CRITIQUE';
  }

  private enrichRisk(risk: any) {
    return { ...risk, niveau_criticite: this.getNiveauCriticite(risk.criticite) };
  }

  async create(projectId: string, dto: CreateRiskDto) {
    await this.verifyProject(projectId);
    const criticite = dto.probabilite * dto.impact;
    const risk = await this.prisma.risque.create({
      data: {
        projet_id: projectId,
        categorie: dto.categorie,
        description: dto.description,
        probabilite: dto.probabilite,
        impact: dto.impact,
        criticite,
        strategie_attenuation: dto.strategie_attenuation,
        responsable: dto.responsable,
        statut: dto.statut ?? 'IDENTIFIE',
      },
    });
    return this.enrichRisk(risk);
  }

  async findAll(projectId: string, query: QueryRisksDto) {
    await this.verifyProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId, deletedAt: null };
    if (query.categorie) where.categorie = { contains: query.categorie, mode: 'insensitive' };
    if (query.statut) where.statut = query.statut;
    if (query.niveau_criticite) {
      const ranges: Record<string, { gte: number; lte: number }> = {
        FAIBLE: { gte: 1, lte: 2 },
        MOYEN: { gte: 3, lte: 4 },
        ELEVE: { gte: 5, lte: 6 },
        CRITIQUE: { gte: 7, lte: 9 },
      };
      if (ranges[query.niveau_criticite]) where.criticite = ranges[query.niveau_criticite];
    }

    const [risks, total] = await Promise.all([
      this.prisma.risque.findMany({ where, skip, take: limit, orderBy: { criticite: 'desc' } }),
      this.prisma.risque.count({ where }),
    ]);

    return {
      data: risks.map((r) => this.enrichRisk(r)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(projectId: string, id: string) {
    const risk = await this.prisma.risque.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
    });
    if (!risk) throw new NotFoundException('Risque introuvable');
    return this.enrichRisk(risk);
  }

  async update(projectId: string, id: string, dto: UpdateRiskDto) {
    const existing = await this.findOne(projectId, id);
    const probabilite = dto.probabilite ?? existing.probabilite;
    const impact = dto.impact ?? existing.impact;
    const criticite = probabilite * impact;

    const updated = await this.prisma.risque.update({
      where: { id },
      data: {
        categorie: dto.categorie,
        description: dto.description,
        probabilite,
        impact,
        criticite,
        strategie_attenuation: dto.strategie_attenuation,
        responsable: dto.responsable,
        statut: dto.statut,
      },
    });
    return this.enrichRisk(updated);
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.risque.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async getMatrix(projectId: string) {
    await this.verifyProject(projectId);
    const risks = await this.prisma.risque.findMany({
      where: { projet_id: projectId, deletedAt: null },
      select: {
        probabilite: true,
        impact: true,
        criticite: true,
        description: true,
        categorie: true,
        statut: true,
      },
    });

    const matrix: Record<string, Record<string, any[]>> = {};
    for (let p = 1; p <= 3; p++) {
      matrix[p] = {};
      for (let i = 1; i <= 3; i++) {
        matrix[p][i] = risks.filter((r) => r.probabilite === p && r.impact === i);
      }
    }
    return {
      matrice: matrix,
      legende: { '1-2': 'FAIBLE', '3-4': 'MOYEN', '5-6': 'ELEVE', '7-9': 'CRITIQUE' },
      total: risks.length,
    };
  }
}
