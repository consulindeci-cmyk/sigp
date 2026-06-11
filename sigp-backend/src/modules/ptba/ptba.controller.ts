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
import { PtbaService } from './ptba.service';
import { CreatePtbaDto, UpdatePtbaDto, QueryPtbaDto } from './dto/ptba.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('PTBA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/ptba')
export class PtbaController {
  constructor(private readonly ptbaService: PtbaService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une activité PTBA' })
  create(@Param('projectId') projectId: string, @Body() dto: CreatePtbaDto) {
    return this.ptbaService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste PTBA avec filtres (statut, trimestre, composante)' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryPtbaDto) {
    return this.ptbaService.findAll(projectId, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export JSON structuré par composante' })
  export(@Param('projectId') projectId: string) {
    return this.ptbaService.exportByComposante(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une activité PTBA" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.ptbaService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une activité PTBA' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePtbaDto,
  ) {
    return this.ptbaService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une activité PTBA' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.ptbaService.remove(projectId, id);
  }
}
