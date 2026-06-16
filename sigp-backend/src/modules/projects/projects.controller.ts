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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto/project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EvmService } from '../evm/evm.service';

@ApiTags('Projets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly evmService: EvmService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un projet' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des projets avec pagination et filtres' })
  findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail complet d'un projet avec relations" })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un projet' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un projet' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Résumé financier du projet' })
  getSummary(@Param('id') id: string) {
    return this.projectsService.getSummary(id);
  }

  @Get(':id/evm')
  @ApiOperation({ summary: 'Indicateurs EVM complets pour ce projet' })
  getEvm(@Param('id') id: string, @Query('dateControle') dateControle?: string) {
    return this.evmService.calculateProjectEvm(
      id,
      dateControle ? new Date(dateControle) : undefined,
    );
  }
}
