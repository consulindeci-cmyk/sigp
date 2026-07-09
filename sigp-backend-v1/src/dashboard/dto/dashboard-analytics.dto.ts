import { ApiProperty } from '@nestjs/swagger';

export class DashboardEvmDataPointDto {
  @ApiProperty({ example: '2026-Q1' })
  date: string;

  @ApiProperty({ example: 5000, description: 'PV — Valeur planifiée (en milliers)' })
  pv: number;

  @ApiProperty({ example: 4200, description: 'EV — Valeur acquise (en milliers)' })
  ev: number;

  @ApiProperty({ example: 4800, description: 'AC — Coût réel (en milliers)' })
  ac: number;
}

export class DashboardTimeSeriesItemDto {
  @ApiProperty({ example: 'Juin' })
  label: string;

  @ApiProperty({ example: 12.5, description: 'Montant en millions' })
  value: number;
}

export class DashboardDistributionItemDto {
  @ApiProperty({ example: 'Infrastructures' })
  label: string;

  @ApiProperty({ example: 12300000 })
  value: number;
}

export class DashboardCriticalActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'A1.2' })
  code: string;

  @ApiProperty({ example: "Étude d'impact environnemental" })
  name: string;

  @ApiProperty({ enum: ['blocked', 'delayed'] })
  status: 'blocked' | 'delayed';

  @ApiProperty({ example: 14 })
  delayDays: number;
}

export class DashboardMainRiskDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Fluctuation taux de change' })
  description: string;

  @ApiProperty({ example: 75, description: '0–100' })
  probability: number;

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  level: 'high' | 'medium' | 'low';
}

export class DashboardMilestoneDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Audit financier intermédiaire' })
  title: string;

  @ApiProperty({ example: '2026-08-02' })
  date: string;

  @ApiProperty({ enum: ['achieved', 'delayed', 'pending'] })
  status: 'achieved' | 'delayed' | 'pending';
}

export class DashboardEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Décaissement de 1,2 M reçu.' })
  description: string;

  @ApiProperty({ example: '2026-07-09' })
  date: string;

  @ApiProperty({ enum: ['alert', 'validation', 'payment', 'milestone'] })
  type: 'alert' | 'validation' | 'payment' | 'milestone';
}

export class DashboardRecentActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'PTBA T2 2026 validé' })
  title: string;

  @ApiProperty({ example: 'PROJ-014 - Électrification Rurale' })
  meta: string;

  @ApiProperty({ example: 'Il y a 2h' })
  time: string;

  @ApiProperty({ example: 'bg-success' })
  colorClass: string;
}

export class DashboardUpcomingDeadlineDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Rapport financier T2' })
  title: string;

  @ApiProperty({ example: 'PROJ-021' })
  meta: string;

  @ApiProperty({ example: 'Dans 3 jours' })
  time: string;

  @ApiProperty({ example: 'bg-warning' })
  colorClass: string;
}

export class DashboardTimelineItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Rapport T2 Banque Mondiale' })
  title: string;

  @ApiProperty({ example: 'Juil. 2026' })
  date: string;

  @ApiProperty({ example: 'PROJ-014' })
  project: string;

  @ApiProperty({ enum: ['deadline', 'milestone', 'event'] })
  type: 'deadline' | 'milestone' | 'event';
}
