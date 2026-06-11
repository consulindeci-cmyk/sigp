import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogframeService } from './logframe.service';
import { CreateLogframeDto, UpdateLogframeDto } from './dto/logframe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cadre Logique (Logframe)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/logframe')
export class LogframeController {
  constructor(private readonly logframeService: LogframeService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une entrée dans le cadre logique' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateLogframeDto) {
    return this.logframeService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste du cadre logique du projet' })
  findAll(@Param('projectId') projectId: string) {
    return this.logframeService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une entrée cadre logique" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.logframeService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une entrée cadre logique' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLogframeDto,
  ) {
    return this.logframeService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une entrée cadre logique' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.logframeService.remove(projectId, id);
  }
}
