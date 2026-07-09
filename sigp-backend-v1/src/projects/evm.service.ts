import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { EvmSummaryResponseDto } from './dto/evm-summary-response.dto';
import { EvmHistoryResponseDto } from './dto/evm-history-response.dto';

@Injectable()
export class EvmService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvmSummary(projectId: string): Promise<EvmSummaryResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deleted_at: null },
    });
    if (!project) {
      throw new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable');
    }

    const [budgetAgg, activites] = await Promise.all([
      this.prisma.budgetLigne.aggregate({
        where: {
          version: { project_id: projectId, deleted_at: null },
          deleted_at: null,
        },
        _sum: { montant_prevu: true, montant_paye: true },
      }),
      this.prisma.ptbaActivite.findMany({
        where: { project_id: projectId, deleted_at: null },
        select: {
          montant_prevu: true,
          taux_realisation: true,
          date_debut_prevue: true,
          date_fin_prevue: true,
        },
      }),
    ]);

    const bac = Number(budgetAgg._sum.montant_prevu ?? 0);
    const ac = Number(budgetAgg._sum.montant_paye ?? 0);

    let pv = 0;
    let ev = 0;

    const now = new Date();

    for (const act of activites) {
      const budget = Number(act.montant_prevu ?? 0);
      const taux = Number(act.taux_realisation ?? 0);
      ev += budget * (taux / 100);

      // Calcul proportionnel du PV
      if (act.date_debut_prevue && act.date_fin_prevue) {
        const debut = act.date_debut_prevue.getTime();
        const fin = act.date_fin_prevue.getTime();
        const actuel = now.getTime();

        if (actuel >= fin) {
          pv += budget;
        } else if (actuel > debut) {
          const ratio = (actuel - debut) / (fin - debut);
          pv += budget * ratio;
        }
      } else {
        // Fallback si pas de dates, on suppose PV = EV par sécurité (ou 0)
        // Dans une implémentation stricte, une activité sans date n'a pas de PV planifié.
      }
    }

    const sv = ev - pv;
    const cv = ev - ac;
    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;

    // EAC: Estimate At Completion (BAC / CPI)
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const vac = bac - eac;

    return {
      pv: Math.round(pv),
      ev: Math.round(ev),
      ac: Math.round(ac),
      sv: Math.round(sv),
      cv: Math.round(cv),
      spi: Number(spi.toFixed(4)),
      cpi: Number(cpi.toFixed(4)),
      eac: Math.round(eac),
      etc: Math.round(etc),
      vac: Math.round(vac),
    };
  }

  async getEvmHistory(projectId: string): Promise<EvmHistoryResponseDto[]> {
    const snapshots = await this.prisma.evmSnapshot.findMany({
      where: { project_id: projectId },
      orderBy: { periode: 'asc' },
    });

    return snapshots.map((s) => ({
      periode: s.periode,
      pv: Number(s.pv),
      ev: Number(s.ev),
      ac: Number(s.ac),
    }));
  }
}
