import { Controller, Get, Header, Param, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryResponseDto, HistoryDetailResponseDto } from './dto/history-response.dto';
import { HistoryListResponseDto } from './dto/history-list-response.dto';
import { HistoryStatsResponseDto } from './dto/history-stats-response.dto';

const READ_ROLES = [
  UserRole.ADMIN,
  UserRole.COORDINATEUR,
  UserRole.CHARGE_PROGRAMME,
  UserRole.FINANCIER,
  UserRole.AUDITEUR,
  UserRole.VIEWER,
] as const;

@ApiTags('history')
@Controller({ path: 'history', version: '1' })
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // Routes statiques déclarées AVANT ':id' pour éviter toute collision de route.

  @Get('stats')
  @ApiAuth(...READ_ROLES)
  @ApiOperation({ summary: "Statistiques agrégées du journal d'historique" })
  @ApiOkResponse({ description: 'Statistiques calculées', type: HistoryStatsResponseDto })
  async getStats(@Query('projectId') projectId?: string): Promise<HistoryStatsResponseDto> {
    return this.historyService.getStats(projectId);
  }

  @Get('modules')
  @ApiAuth(...READ_ROLES)
  @ApiOperation({ summary: 'Modules réellement présents dans le journal (pour filtres)' })
  @ApiOkResponse({ description: 'Liste des modules' })
  async getModules(): Promise<{ module: string; moduleLabel: string }[]> {
    return this.historyService.getModules();
  }

  @Get('export')
  @ApiAuth(...READ_ROLES)
  @ApiOperation({ summary: "Export CSV de l'historique (mêmes filtres que la liste)" })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="historique.csv"')
  async exportCsv(@Query() query: HistoryQueryDto, @Res() res: Response): Promise<void> {
    const csv = await this.historyService.exportCsv(query);
    res.send(csv);
  }

  @Get()
  @ApiAuth(...READ_ROLES)
  @ApiOperation({ summary: "Liste paginée de l'historique (journal d'audit ERP)" })
  @ApiOkResponse({ description: 'Liste paginée', type: HistoryListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: HistoryQueryDto): Promise<HistoryListResponseDto> {
    return this.historyService.findAll(query);
  }

  @Get(':id')
  @ApiAuth(...READ_ROLES)
  @ApiOperation({ summary: "Détail d'une entrée d'historique (avec instantané avant/après)" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Entrée trouvée', type: HistoryDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Entrée introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HistoryResponseDto> {
    return this.historyService.findOne(id);
  }
}
