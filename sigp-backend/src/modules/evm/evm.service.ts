import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EvmIndicateurs {
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
  statut_cpi: 'VERT' | 'ORANGE' | 'ROUGE';
  statut_spi: 'VERT' | 'ORANGE' | 'ROUGE';
}

@Injectable()
export class EvmService {
  constructor(private readonly prisma: PrismaService) {}

  private calculerPV(
    budgetAlloue: number,
    dateDebut: Date,
    dateFin: Date,
    dateControle: Date,
  ): number {
    if (dateControle < dateDebut) return 0;
    if (dateControle >= dateFin) return budgetAlloue;
    const dureeTotal = dateFin.getTime() - dateDebut.getTime();
    const dureeEcoulee = dateControle.getTime() - dateDebut.getTime();
    return budgetAlloue * (dureeEcoulee / dureeTotal);
  }

  private getStatut(index: number): 'VERT' | 'ORANGE' | 'ROUGE' {
    if (index >= 1.0) return 'VERT';
    if (index >= 0.9) return 'ORANGE';
    return 'ROUGE';
  }

  private calculerEvm(
    taches: Array<{
      cout_prevu: any;
      cout_reel: any;
      avancement: number;
      date_debut: Date | null;
      date_fin: Date | null;
    }>,
    dateControle: Date,
  ): EvmIndicateurs {
    let bac = 0,
      ev = 0,
      ac = 0,
      pv = 0;

    for (const t of taches) {
      const budgetAlloue = Number(t.cout_prevu);
      const coutReel = Number(t.cout_reel);
      const avancement = t.avancement ?? 0;

      bac += budgetAlloue;
      ev += budgetAlloue * (avancement / 100);
      ac += coutReel;

      if (t.date_debut && t.date_fin) {
        pv += this.calculerPV(budgetAlloue, t.date_debut, t.date_fin, dateControle);
      } else {
        // Si pas de dates, considérer PV = EV (cas dégradé)
        pv += budgetAlloue * (avancement / 100);
      }
    }

    const cv = ev - ac;
    const sv = ev - pv;
    const cpi = ac === 0 ? 1 : ev / ac;
    const spi = pv === 0 ? 1 : ev / pv;
    const eac = cpi === 0 ? bac : bac / cpi;
    const vac = bac - eac;

    return {
      bac: Math.round(bac * 100) / 100,
      pv: Math.round(pv * 100) / 100,
      ev: Math.round(ev * 100) / 100,
      ac: Math.round(ac * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      sv: Math.round(sv * 100) / 100,
      cpi: Math.round(cpi * 10000) / 10000,
      spi: Math.round(spi * 10000) / 10000,
      eac: Math.round(eac * 100) / 100,
      vac: Math.round(vac * 100) / 100,
      statut_cpi: this.getStatut(cpi),
      statut_spi: this.getStatut(spi),
    };
  }

  async calculateProjectEvm(
    projectId: string,
    dateControle?: Date,
  ): Promise<EvmIndicateurs & { projet_id: string; date_controle: string }> {
    const projet = await this.prisma.projet.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!projet) throw new NotFoundException('Projet introuvable');

    const taches = await this.prisma.tache.findMany({
      where: { projet_id: projectId, deletedAt: null, statut: { not: 'ANNULE' } },
    });

    const dc = dateControle ?? new Date();
    const evm = this.calculerEvm(taches, dc);

    return { ...evm, projet_id: projectId, date_controle: dc.toISOString() };
  }

  async calculateTasksEvm(projectId: string, dateControle?: Date) {
    const taches = await this.prisma.tache.findMany({
      where: { projet_id: projectId, deletedAt: null, statut: { not: 'ANNULE' } },
      include: { wbs: { select: { nom_phase: true } } },
    });

    const dc = dateControle ?? new Date();
    return taches.map((t) => {
      const budgetAlloue = Number(t.cout_prevu);
      const coutReel = Number(t.cout_reel);
      const avancement = t.avancement ?? 0;

      const ev = budgetAlloue * (avancement / 100);
      const ac = coutReel;
      const pv =
        t.date_debut && t.date_fin
          ? this.calculerPV(budgetAlloue, t.date_debut, t.date_fin, dc)
          : ev;

      const cv = ev - ac;
      const sv = ev - pv;
      const cpi = ac === 0 ? 1 : ev / ac;
      const spi = pv === 0 ? 1 : ev / pv;
      const eac = cpi === 0 ? budgetAlloue : budgetAlloue / cpi;

      return {
        tache_id: t.id,
        code_tache: t.code_tache,
        description: t.description,
        wbs: t.wbs?.nom_phase,
        statut: t.statut,
        avancement,
        bac: budgetAlloue,
        pv: Math.round(pv * 100) / 100,
        ev: Math.round(ev * 100) / 100,
        ac: Math.round(ac * 100) / 100,
        cv: Math.round(cv * 100) / 100,
        sv: Math.round(sv * 100) / 100,
        cpi: Math.round(cpi * 10000) / 10000,
        spi: Math.round(spi * 10000) / 10000,
        eac: Math.round(eac * 100) / 100,
        statut_cpi: this.getStatut(cpi),
        statut_spi: this.getStatut(spi),
      };
    });
  }

  async calculateTrend(projectId: string) {
    const projet = await this.prisma.projet.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!projet) throw new NotFoundException('Projet introuvable');

    const taches = await this.prisma.tache.findMany({
      where: { projet_id: projectId, deletedAt: null, statut: { not: 'ANNULE' } },
    });

    const dateDebut = projet.date_debut;
    const dateFin = projet.date_fin;
    const now = new Date();
    const endDate = now < dateFin ? now : dateFin;

    const months: Array<{ mois: string; pv: number; ev: number; ac: number }> = [];
    const current = new Date(dateDebut);
    current.setDate(1);

    while (current <= endDate) {
      const dateControle = new Date(current);
      dateControle.setMonth(dateControle.getMonth() + 1);
      dateControle.setDate(0); // Dernier jour du mois

      const evm = this.calculerEvm(taches, dateControle);
      months.push({
        mois: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
        pv: evm.pv,
        ev: evm.ev,
        ac: evm.ac,
      });

      current.setMonth(current.getMonth() + 1);
      if (months.length >= 36) break; // Maximum 3 ans
    }

    return { projet_id: projectId, evolution_mensuelle: months };
  }
}
