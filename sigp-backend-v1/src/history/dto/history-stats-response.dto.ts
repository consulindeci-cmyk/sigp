import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class HistoryActionCountDto {
  @ApiProperty({ enum: AuditAction }) action: AuditAction;
  @ApiProperty() count: number;
}

export class HistoryModuleCountDto {
  @ApiProperty() module: string;
  @ApiProperty() moduleLabel: string;
  @ApiProperty() count: number;
}

export class HistoryDailyCountDto {
  @ApiProperty({ example: '2026-07-13' }) date: string;
  @ApiProperty() count: number;
}

export class HistoryStatsResponseDto {
  @ApiProperty() total: number;
  @ApiProperty() totalToday: number;
  @ApiProperty() totalThisWeek: number;
  @ApiProperty({ type: [HistoryActionCountDto] }) byAction: HistoryActionCountDto[];
  @ApiProperty({ type: [HistoryModuleCountDto] }) byModule: HistoryModuleCountDto[];
  @ApiProperty({ type: [HistoryDailyCountDto], description: 'Volume quotidien — 30 derniers jours' })
  dailyVolume: HistoryDailyCountDto[];
}
