import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { HistoryRepository } from './history.repository';
import { HistoryQueryDto } from './dto/history-query.dto';
import {
  HistoryDetailResponseDto,
  HistoryResponseDto,
  MODULE_LABELS,
} from './dto/history-response.dto';
import { HistoryStatsResponseDto } from './dto/history-stats-response.dto';

const SORTABLE_FIELDS = ['created_at', 'action', 'table_cible'] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class HistoryService {
  constructor(private readonly historyRepository: HistoryRepository) {}

  async findAll(query: HistoryQueryDto): Promise<PaginatedResult<HistoryResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { entries, total } = await this.historyRepository.findManyPaginated({
      skip,
      take,
      projectId: query.projectId,
      userId: query.userId,
      action: query.action,
      module: query.module,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(entries.map(HistoryResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<HistoryDetailResponseDto> {
    const entry = await this.historyRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(ErrorCode.HISTORY_NOT_FOUND, "Entrée d'historique introuvable");
    }
    return HistoryDetailResponseDto.fromEntityDetailed(entry);
  }

  async getModules(): Promise<{ module: string; moduleLabel: string }[]> {
    const modules = await this.historyRepository.findDistinctModules();
    return modules.map((module) => ({
      module,
      moduleLabel: MODULE_LABELS[module] ?? module,
    }));
  }

  async getStats(projectId?: string): Promise<HistoryStatsResponseDto> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [total, totalToday, totalThisWeek, byAction, byModule, dailyVolume] = await Promise.all(
      [
        this.historyRepository.countTotal(projectId),
        this.historyRepository.countSince(todayStart, projectId),
        this.historyRepository.countSince(weekStart, projectId),
        this.historyRepository.countByAction({ projectId }),
        this.historyRepository.countByModule({ projectId }),
        this.historyRepository.dailyVolume({ projectId }),
      ],
    );

    return {
      total,
      totalToday,
      totalThisWeek,
      byAction,
      byModule: byModule.map((m) => ({
        module: m.module,
        moduleLabel: MODULE_LABELS[m.module] ?? m.module,
        count: m.count,
      })),
      dailyVolume: this.fillMissingDays(dailyVolume),
    };
  }

  async exportCsv(query: HistoryQueryDto): Promise<string> {
    const MAX_EXPORT_ROWS = 5000;
    const { entries } = await this.historyRepository.findManyPaginated({
      skip: 0,
      take: MAX_EXPORT_ROWS,
      projectId: query.projectId,
      userId: query.userId,
      action: query.action,
      module: query.module,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      orderBy: { created_at: 'desc' },
    });

    const rows = entries.map(HistoryResponseDto.fromEntity);
    const headers = [
      'Date',
      'Utilisateur',
      'Rôle',
      'Action',
      'Module',
      'Élément',
      'Projet',
      'Adresse IP',
    ];
    const lines = [headers, ...rows.map((r) => [
      r.createdAt.toISOString(),
      r.userNom ?? '',
      r.userRole ?? '',
      r.action,
      r.moduleLabel,
      r.elementLabel ?? '',
      r.projectNom ?? '',
      r.ipAddress ?? '',
    ])];

    const BOM = '﻿';
    return (
      BOM +
      lines
        .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n')
    );
  }

  /** Complète les jours sans événement par 0 — le frontend ne doit jamais avoir à
   *  deviner les jours manquants d'une série temporelle. */
  private fillMissingDays(
    sparse: { date: string; count: number }[],
  ): { date: string; count: number }[] {
    const byDate = new Map(sparse.map((d) => [d.date, d.count]));
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * MS_PER_DAY);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: byDate.get(key) ?? 0 });
    }
    return days;
  }
}
