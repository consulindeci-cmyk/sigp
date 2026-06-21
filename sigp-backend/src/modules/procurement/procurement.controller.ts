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
import { ProcurementService } from './procurement.service';
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  QueryProcurementDto,
} from './dto/procurement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Plan de Passation des Marchés (PPM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un marché' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProcurementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.procurementService.create(projectId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des marchés avec filtres' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryProcurementDto) {
    return this.procurementService.findAll(projectId, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Calendrier des marchés trié par date_prevue' })
  getCalendar(@Param('projectId') projectId: string) {
    return this.procurementService.getCalendar(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un marché" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.procurementService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un marché' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProcurementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.procurementService.update(projectId, id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un marché' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.procurementService.remove(projectId, id);
  }
}
