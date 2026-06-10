import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RisksService } from './risks.service';
import { CreateRiskDto, UpdateRiskDto, QueryRisksDto } from './dto/risk.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Risques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un risque (calcul auto criticité)' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateRiskDto) {
    return this.risksService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des risques avec filtres (catégorie, niveau criticité, statut)' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryRisksDto) {
    return this.risksService.findAll(projectId, query);
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Matrice probabilité × impact (données pour graphique)' })
  getMatrix(@Param('projectId') projectId: string) {
    return this.risksService.getMatrix(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un risque" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.risksService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un risque (recalcul auto criticité)' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.risksService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un risque' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.risksService.remove(projectId, id);
  }
}
