import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { StatutTache } from '@prisma/client';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
    return p;
  }

  async create(projectId: string, dto: CreateBudgetDto) {
    await this.verifyProject(projectId);
    const quantite = dto.quantite ?? 1;
    const coutUnitaire = parseFloat(dto.cout_unitaire);
    const coutTotal = quantite * coutUnitaire;

    return this.prisma.ligneBudgetaire.create({
      data: {
        projet_id: projectId,
        code_budget: dto.code_budget,
        rubrique: dto.rubrique,
        sous_rubrique: dto.sous_rubrique,
        unite: dto.unite,
        quantite,
        cout_unitaire: coutUnitaire,
        cout_total: coutTotal,
        financement_bailleur: dto.financement_bailleur ?? 0,
        contrepartie_etat: dto.contrepartie_etat ?? 0,
        commentaire: dto.commentaire,
      },
    });
  }

  async findAll(projectId: string) {
    await this.verifyProject(projectId);
    const lignes = await this.prisma.ligneBudgetaire.findMany({
      where: { projet_id: projectId, deletedAt: null },
      orderBy: { code_budget: 'asc' },
    });

    const totaux = lignes.reduce(
      (acc, l) => ({
        cout_total: acc.cout_total + Number(l.cout_total),
        financement_bailleur: acc.financement_bailleur + Number(l.financement_bailleur),
        contrepartie_etat: acc.contrepartie_etat + Number(l.contrepartie_etat),
      }),
      { cout_total: 0, financement_bailleur: 0, contrepartie_etat: 0 },
    );

    return { data: lignes, totaux };
  }

  async findOne(projectId: string, id: string) {
    const ligne = await this.prisma.ligneBudgetaire.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
      include: { taches: { where: { deletedAt: null } } },
    });
    if (!ligne) throw new NotFoundException('Ligne budgétaire introuvable');
    return ligne;
  }

  async update(projectId: string, id: string, dto: UpdateBudgetDto) {
    const existing = await this.findOne(projectId, id);
    const quantite = dto.quantite ?? existing.quantite;
    const coutUnitaire = dto.cout_unitaire
      ? parseFloat(dto.cout_unitaire)
      : Number(existing.cout_unitaire);
    const coutTotal = quantite * coutUnitaire;

    return this.prisma.ligneBudgetaire.update({
      where: { id },
      data: {
        rubrique: dto.rubrique,
        sous_rubrique: dto.sous_rubrique,
        unite: dto.unite,
        quantite,
        cout_unitaire: coutUnitaire,
        cout_total: coutTotal,
        financement_bailleur: dto.financement_bailleur,
        contrepartie_etat: dto.contrepartie_etat,
        commentaire: dto.commentaire,
      },
    });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.ligneBudgetaire.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async getSummary(projectId: string) {
    await this.verifyProject(projectId);
    const lignes = await this.prisma.ligneBudgetaire.findMany({
      where: { projet_id: projectId, deletedAt: null },
      include: { taches: { where: { deletedAt: null } } },
    });

    let budgetTotal = 0,
      montantEngage = 0,
      montantDecaisse = 0;
    for (const l of lignes) {
      budgetTotal += Number(l.cout_total);
      for (const t of l.taches) {
        if (t.statut === StatutTache.EN_COURS) montantEngage += Number(t.cout_prevu);
        if (t.statut === StatutTache.TERMINE) montantDecaisse += Number(t.cout_reel);
      }
    }

    return {
      projet_id: projectId,
      budget_total: budgetTotal,
      montant_engage: montantEngage,
      montant_decaisse: montantDecaisse,
      solde_disponible: budgetTotal - montantEngage - montantDecaisse,
      taux_consommation_pct:
        budgetTotal > 0
          ? Math.round(((montantEngage + montantDecaisse) / budgetTotal) * 10000) / 100
          : 0,
    };
  }
}
