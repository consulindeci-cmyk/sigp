import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { StatutTache } from '@prisma/client';
import { LedgerService } from '../projects/ledger.service';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
    return p;
  }

  async create(projectId: string, dto: CreateBudgetDto, userId: string) {
    await this.verifyProject(projectId);
    const quantite = dto.quantite ?? 1;
    const coutUnitaire = parseFloat(dto.cout_unitaire);
    const coutTotal = quantite * coutUnitaire;

    return this.prisma.$transaction(async (tx) => {
      const ligne = await tx.ligneBudgetaire.create({
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

      // Engagement initial du budget
      await this.ledgerService.dispatchToOutbox(tx, {
        aggregateType: 'LIGNE_BUDGETAIRE',
        aggregateId: ligne.id,
        eventType: 'ENGAGEMENT_BUDGETAIRE',
        auteur_id: userId,
        payload: {
          projet_id: ligne.projet_id,
          entite_type: 'LIGNE_BUDGETAIRE',
          montant_engage: coutTotal,
          montant_decaisse: 0,
          description: `Ouverture Ligne Budgétaire: ${ligne.rubrique}`,
          snapshot: { ...ligne }
        }
      });

      return ligne;
    });
  }

  async findAll(projectId: string) {
    await this.verifyProject(projectId);
    const lignesRaw = await this.prisma.ligneBudgetaire.findMany({
      where: { projet_id: projectId, deletedAt: null },
      include: { taches: { where: { deletedAt: null } } },
      orderBy: { code_budget: 'asc' },
    });

    const lignes = lignesRaw.map((l) => {
      let engage = 0;
      let decaisse = 0;
      for (const t of l.taches) {
        if (t.statut === StatutTache.EN_COURS || t.statut === StatutTache.TERMINE) {
          engage += Number(t.cout_prevu?.toString() || 0);
        }
        if (t.statut === StatutTache.TERMINE) {
          decaisse += Number(t.cout_reel?.toString() || 0);
        }
      }
      
      const budget = Number(l.cout_total?.toString() || 0);
      const taux = budget > 0 ? Math.round((engage / budget) * 10000) / 100 : 0;
      
      let niveau_alerte = 'OK';
      if (taux > 90) niveau_alerte = 'CRITIQUE';
      else if (taux > 80) niveau_alerte = 'VIGILANCE';

      return {
        ...l,
        montant_engage: engage,
        montant_decaisse: decaisse,
        taux_consommation_pct: taux,
        niveau_alerte,
      };
    });

    const totaux = lignes.reduce(
      (acc, l) => ({
        cout_total: acc.cout_total + Number(l.cout_total?.toString() || 0),
        financement_bailleur: acc.financement_bailleur + Number(l.financement_bailleur?.toString() || 0),
        contrepartie_etat: acc.contrepartie_etat + Number(l.contrepartie_etat?.toString() || 0),
        montant_engage: acc.montant_engage + l.montant_engage,
        montant_decaisse: acc.montant_decaisse + l.montant_decaisse,
      }),
      { cout_total: 0, financement_bailleur: 0, contrepartie_etat: 0, montant_engage: 0, montant_decaisse: 0 },
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

  async update(projectId: string, id: string, dto: UpdateBudgetDto, userId: string) {
    const existing = await this.findOne(projectId, id);
    const quantite = dto.quantite ?? existing.quantite;
    const coutUnitaire = dto.cout_unitaire ? parseFloat(dto.cout_unitaire) : Number(existing.cout_unitaire);
    const coutTotal = quantite * coutUnitaire;

    return this.prisma.$transaction(async (tx) => {
      const ligne = await tx.ligneBudgetaire.update({
        where: { id },
        data: {
          code_budget: dto.code_budget,
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

      const oldTotal = Number(existing.cout_total);
      if (coutTotal !== oldTotal) {
        const diff = coutTotal - oldTotal;
        await this.ledgerService.dispatchToOutbox(tx, {
          aggregateType: 'LIGNE_BUDGETAIRE',
          aggregateId: ligne.id,
          eventType: 'ENGAGEMENT_BUDGETAIRE',
          auteur_id: userId,
          payload: {
            projet_id: ligne.projet_id,
            entite_type: 'LIGNE_BUDGETAIRE',
            montant_engage: diff, // Montant positif (ajout) ou négatif (réduction)
            montant_decaisse: 0,
            description: `Ajustement Ligne Budgétaire: ${ligne.rubrique}`,
            snapshot: { ...ligne }
          }
        });
      }

      return ligne;
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
      
    const rubriquesMap: Record<string, { budget: number; engage: number; decaisse: number }> = {};

    for (const l of lignes) {
      const budget = Number(l.cout_total?.toString() || 0);
      budgetTotal += budget;
      
      let lEngage = 0;
      let lDecaisse = 0;
      for (const t of l.taches) {
        if (t.statut === StatutTache.EN_COURS || t.statut === StatutTache.TERMINE) {
          lEngage += Number(t.cout_prevu?.toString() || 0);
        }
        if (t.statut === StatutTache.TERMINE) {
          lDecaisse += Number(t.cout_reel?.toString() || 0);
        }
      }
      montantEngage += lEngage;
      montantDecaisse += lDecaisse;
      
      const rub = l.rubrique && l.rubrique.trim() !== '' ? l.rubrique : 'Rubrique non renseignée';
      if (!rubriquesMap[rub]) rubriquesMap[rub] = { budget: 0, engage: 0, decaisse: 0 };
      rubriquesMap[rub].budget += budget;
      rubriquesMap[rub].engage += lEngage;
      rubriquesMap[rub].decaisse += lDecaisse;
    }
    
    const consommation_par_rubrique = Object.entries(rubriquesMap).map(([rubrique, vals]) => {
      return {
        rubrique,
        budget: vals.budget,
        engage: vals.engage,
        decaisse: vals.decaisse,
        taux_consommation_pct: vals.budget > 0 ? Math.round((vals.engage / vals.budget) * 10000) / 100 : 0
      }
    }).sort((a, b) => b.taux_consommation_pct - a.taux_consommation_pct);

    const budgetStatus = lignes.length === 0 ? 'EMPTY' : 'ACTIVE';

    return {
      projet_id: projectId,
      budgetStatus,
      budget_total: budgetTotal,
      montant_engage: montantEngage,
      montant_decaisse: montantDecaisse,
      solde_disponible: budgetTotal - montantEngage,
      taux_consommation_pct:
        budgetTotal > 0
          ? Math.round((montantEngage / budgetTotal) * 10000) / 100
          : 0,
      consommation_par_rubrique,
    };
  }
}
