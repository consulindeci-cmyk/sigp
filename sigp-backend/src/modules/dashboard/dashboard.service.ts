import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvmService } from '../evm/evm.service';
import { StatutProjet, StatutTache, StatutMarche } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evmService: EvmService,
  ) {}

  async getGlobal(projectId?: string) {
    const projetWhere: any = { deletedAt: null };
    const childWhere: any = { deletedAt: null };

    if (projectId) {
      projetWhere.id = projectId;
      childWhere.projet_id = projectId;
    }

    // ── Projets ──────────────────────────────────────────────────────────
    const [totalProjets, actifs, enPreparation, clotures] = await Promise.all([
      this.prisma.projet.count({ where: projetWhere }),
      this.prisma.projet.count({ where: { ...projetWhere, statut: StatutProjet.ACTIF } }),
      this.prisma.projet.count({ where: { ...projetWhere, statut: StatutProjet.PREPARATION } }),
      this.prisma.projet.count({ where: { ...projetWhere, statut: StatutProjet.CLOTURE } }),
    ]);

    // ── Financier ────────────────────────────────────────────────────────
    const projets = await this.prisma.projet.findMany({ where: projetWhere });
    const budgetTotal = projets.reduce((s, p) => s + Number(p.budget_total?.toString() || 0), 0);

    const taches = await this.prisma.tache.findMany({ where: { ...childWhere } });
    let budgetEngage = 0,
      budgetDecaisse = 0;
    let totalTaches = 0,
      tachesTerminees = 0,
      tachesEnCours = 0,
      tachesAFaire = 0,
      tachesEnRetard = 0;
    let sommeAvancementPondere = 0;
    let sommeCoutPrevu = 0;

    const now = new Date();
    for (const t of taches) {
      const coutPrevuTache = Number(t.cout_prevu?.toString() || 0);
      sommeCoutPrevu += coutPrevuTache;
      sommeAvancementPondere += (t.avancement || 0) * coutPrevuTache;

      totalTaches++;
      if (t.statut === StatutTache.TERMINE) {
        tachesTerminees++;
        budgetDecaisse += Number(t.cout_reel?.toString() || 0);
        budgetEngage += Number(t.cout_prevu?.toString() || 0);
      }
      if (t.statut === StatutTache.EN_COURS) {
        tachesEnCours++;
        budgetEngage += Number(t.cout_prevu?.toString() || 0);
      }
      if (t.statut === StatutTache.A_FAIRE) tachesAFaire++;
      if (
        t.statut !== StatutTache.TERMINE &&
        t.statut !== StatutTache.ANNULE &&
        t.date_fin &&
        t.date_fin < now
      ) {
        tachesEnRetard++;
      }
    }

    const tauxConsommation =
      budgetTotal > 0
        ? Math.round((budgetEngage / budgetTotal) * 10000) / 100
        : 0;
    const tauxAvancement =
      sommeCoutPrevu > 0 ? Math.round((sommeAvancementPondere / sommeCoutPrevu) * 100) / 100 : 0;

    // ── Marchés ──────────────────────────────────────────────────────────
    const marches = await this.prisma.marche.findMany({ where: childWhere });
    const marchesSigne = marches.filter((m) => m.statut === StatutMarche.SIGNE).length;
    const marchesEnCours = marches.filter((m) => m.statut === StatutMarche.EN_COURS).length;
    const montantMarchesEstime = marches.reduce((s, m) => s + Number(m.montant_estime), 0);

    // ── Risques ──────────────────────────────────────────────────────────
    const risques = await this.prisma.risque.findMany({ where: childWhere });
    const rCritiques = risques.filter((r) => r.criticite >= 7).length;
    const rEleves = risques.filter((r) => r.criticite >= 5 && r.criticite <= 6).length;
    const rMoyens = risques.filter((r) => r.criticite >= 3 && r.criticite <= 4).length;
    const rFaibles = risques.filter((r) => r.criticite <= 2).length;

    // ── EVM global ───────────────────────────────────────────────────────
    let evmGlobal: any = {
      bac: 0,
      pv: 0,
      ev: 0,
      ac: 0,
      cv: 0,
      sv: 0,
      cpi: 1,
      spi: 1,
      eac: 0,
      vac: 0,
      statut_cpi: 'VERT',
      statut_spi: 'VERT',
    };
    if (projectId) {
      try {
        evmGlobal = await this.evmService.calculateProjectEvm(projectId);
      } catch (_) {}
    } else if (projets.length > 0) {
      // Agréger EVM de tous les projets actifs
      let totalBac = 0,
        totalPv = 0,
        totalEv = 0,
        totalAc = 0;
      for (const p of projets.filter((pr) => pr.statut === StatutProjet.ACTIF)) {
        try {
          const e = await this.evmService.calculateProjectEvm(p.id);
          totalBac += e.bac;
          totalPv += e.pv;
          totalEv += e.ev;
          totalAc += e.ac;
        } catch (_) {}
      }
      const cv = totalEv - totalAc;
      const sv = totalEv - totalPv;
      const cpi = totalAc === 0 ? 1 : totalEv / totalAc;
      const spi = totalPv === 0 ? 1 : totalEv / totalPv;
      const eac = cpi === 0 ? totalBac : totalBac / cpi;
      evmGlobal = {
        bac: totalBac,
        pv: totalPv,
        ev: totalEv,
        ac: totalAc,
        cv,
        sv,
        cpi: Math.round(cpi * 10000) / 10000,
        spi: Math.round(spi * 10000) / 10000,
        eac,
        vac: totalBac - eac,
        statut_cpi: cpi >= 1 ? 'VERT' : cpi >= 0.9 ? 'ORANGE' : 'ROUGE',
        statut_spi: spi >= 1 ? 'VERT' : spi >= 0.9 ? 'ORANGE' : 'ROUGE',
      };
    }

    return {
      projets: { total: totalProjets, actifs, en_preparation: enPreparation, clotures },
      financier: {
        budget_total_bac: budgetTotal,
        budget_engage: budgetEngage,
        budget_decaisse: budgetDecaisse,
        solde_disponible: budgetTotal - budgetEngage,
        taux_consommation_pct: tauxConsommation,
      },
      activites: {
        total: totalTaches,
        terminees: tachesTerminees,
        en_cours: tachesEnCours,
        a_faire: tachesAFaire,
        en_retard: tachesEnRetard,
        taux_avancement_global_pct: tauxAvancement,
      },
      marches: {
        total: marches.length,
        signes: marchesSigne,
        en_cours: marchesEnCours,
        montant_total_estime: montantMarchesEstime,
      },
      risques: {
        total: risques.length,
        critiques: rCritiques,
        eleves: rEleves,
        moyens: rMoyens,
        faibles: rFaibles,
      },
      evm: evmGlobal,
    };
  }
}
