import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto/project.dto';
import { StatutTache } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const existing = await this.prisma.projet.findUnique({
      where: { code_projet: dto.code_projet },
    });
    if (existing) throw new ConflictException('Ce code projet existe déjà');

    return this.prisma.projet.create({
      data: {
        code_projet: dto.code_projet,
        nom_projet: dto.nom_projet,
        description: dto.description,
        bailleur_principal: dto.bailleur_principal,
        date_debut: new Date(dto.date_debut),
        date_fin: new Date(dto.date_fin),
        budget_total: dto.budget_total,
        devise: dto.devise ?? 'XOF',
        statut: dto.statut ?? 'PREPARATION',
      },
    });
  }

  async findAll(query: QueryProjectsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { nom_projet: { contains: query.search, mode: 'insensitive' } },
        { code_projet: { contains: query.search, mode: 'insensitive' } },
        { bailleur_principal: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.statut) where.statut = query.statut;
    if (query.bailleur)
      where.bailleur_principal = { contains: query.bailleur, mode: 'insensitive' };
    if (query.devise) where.devise = query.devise;

    const [data, total] = await Promise.all([
      this.prisma.projet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          _count: { select: { taches: true, marches: true, risques: true } },
        },
      }),
      this.prisma.projet.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const projet = await this.prisma.projet.findFirst({
      where: { id, deletedAt: null },
      include: {
        sourcesFinancement: { where: { deletedAt: null } },
        wbs: { where: { deletedAt: null } },
        _count: {
          select: { taches: true, marches: true, risques: true, documents: true },
        },
      },
    });
    if (!projet) throw new NotFoundException('Projet introuvable');
    return projet;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.projet.update({
      where: { id },
      data: {
        nom_projet: dto.nom_projet,
        description: dto.description,
        bailleur_principal: dto.bailleur_principal,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin ? new Date(dto.date_fin) : undefined,
        budget_total: dto.budget_total,
        devise: dto.devise,
        statut: dto.statut,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.projet.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, code_projet: true, deletedAt: true },
    });
  }

  async getSummary(id: string) {
    const projet = await this.findOne(id);
    const taches = await this.prisma.tache.findMany({
      where: { projet_id: id, deletedAt: null },
    });

    const budgetTotal = Number(projet.budget_total);
    let montantEngage = 0;
    let montantDecaisse = 0;

    for (const t of taches) {
      if (t.statut === StatutTache.EN_COURS) montantEngage += Number(t.cout_prevu);
      if (t.statut === StatutTache.TERMINE) montantDecaisse += Number(t.cout_reel);
    }

    const solde = budgetTotal - montantEngage - montantDecaisse;
    const tauxConsommation =
      budgetTotal > 0 ? ((montantEngage + montantDecaisse) / budgetTotal) * 100 : 0;

    return {
      projet_id: id,
      code_projet: projet.code_projet,
      nom_projet: projet.nom_projet,
      budget_total: budgetTotal,
      montant_engage: montantEngage,
      montant_decaisse: montantDecaisse,
      solde_disponible: solde,
      taux_consommation_pct: Math.round(tauxConsommation * 100) / 100,
    };
  }
}
