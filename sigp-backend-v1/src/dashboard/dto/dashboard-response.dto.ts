import { ApiProperty } from '@nestjs/swagger';
import { DashboardProjectDto } from './dashboard-project.dto';
import { DashboardFinanceDto } from './dashboard-finance.dto';
import { DashboardRiskDto } from './dashboard-risk.dto';
import { DashboardProcurementDto } from './dashboard-procurement.dto';
import { DashboardOverviewDto } from './dashboard-overview.dto';
import {
  DashboardEvmDataPointDto,
  DashboardTimeSeriesItemDto,
  DashboardDistributionItemDto,
  DashboardCriticalActivityDto,
  DashboardMainRiskDto,
  DashboardMilestoneDto,
  DashboardEventDto,
  DashboardRecentActivityDto,
  DashboardUpcomingDeadlineDto,
  DashboardTimelineItemDto,
} from './dashboard-analytics.dto';

export class DashboardResponseDto {
  @ApiProperty({ type: () => DashboardProjectDto })
  projets: DashboardProjectDto;

  @ApiProperty({ type: () => DashboardFinanceDto })
  finances: DashboardFinanceDto;

  @ApiProperty({ type: () => DashboardRiskDto })
  risques: DashboardRiskDto;

  @ApiProperty({ type: () => DashboardProcurementDto })
  passation: DashboardProcurementDto;

  @ApiProperty({ type: () => DashboardOverviewDto })
  overview: DashboardOverviewDto;

  // ── Analytics sections ──────────────────────────────────────────────────

  @ApiProperty({
    type: [DashboardEvmDataPointDto],
    description: 'Courbes EVM agrégées du portefeuille (PV/EV/AC en K FCFA)',
  })
  evmData: DashboardEvmDataPointDto[];

  @ApiProperty({
    type: [DashboardTimeSeriesItemDto],
    description: 'Décaissements mensuels — 12 derniers mois (M FCFA)',
  })
  decaissementsMensuels: DashboardTimeSeriesItemDto[];

  @ApiProperty({
    type: [DashboardDistributionItemDto],
    description: 'Répartition du budget par catégorie de ligne',
  })
  budgetDistribution: DashboardDistributionItemDto[];

  @ApiProperty({
    type: [DashboardDistributionItemDto],
    description: 'Répartition des financements par source',
  })
  financementDistribution: DashboardDistributionItemDto[];

  @ApiProperty({
    type: [DashboardCriticalActivityDto],
    description: 'Activités critiques — EN_RETARD ou date dépassée (max 10)',
  })
  activitesCritiques: DashboardCriticalActivityDto[];

  @ApiProperty({
    type: [DashboardMainRiskDto],
    description: 'Risques principaux classés par criticité (max 5)',
  })
  risquesPrincipaux: DashboardMainRiskDto[];

  @ApiProperty({
    type: [DashboardMilestoneDto],
    description: 'Prochains jalons (activités PTBA à venir, max 5)',
  })
  jalons: DashboardMilestoneDto[];

  @ApiProperty({
    type: [DashboardEventDto],
    description: 'Événements récents issus des notifications (max 5)',
  })
  evenementsRecents: DashboardEventDto[];

  @ApiProperty({
    type: [DashboardRecentActivityDto],
    description: 'Activités récentes formatées pour la liste (max 5)',
  })
  activitesRecentes: DashboardRecentActivityDto[];

  @ApiProperty({ type: [DashboardUpcomingDeadlineDto], description: 'Échéances à venir (max 10)' })
  echeancesProches: DashboardUpcomingDeadlineDto[];

  @ApiProperty({
    type: [DashboardTimelineItemDto],
    description: 'Ligne de temps : jalons & échéances fusionnés (max 10)',
  })
  timeline: DashboardTimelineItemDto[];

  @ApiProperty({
    description: 'Horodatage de génération du dashboard',
    example: '2026-07-03T10:00:00.000Z',
  })
  generatedAt: Date;
}
