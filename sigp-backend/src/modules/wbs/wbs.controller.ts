import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WbsService } from './wbs.service';
import { CreateWbsDto, UpdateWbsDto } from './dto/wbs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('WBS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/wbs')
export class WbsController {
  constructor(private readonly wbsService: WbsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une phase WBS' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateWbsDto) {
    return this.wbsService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des phases WBS' })
  findAll(@Param('projectId') projectId: string) {
    return this.wbsService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail WBS avec tâches associées' })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.wbsService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une phase WBS' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWbsDto,
  ) {
    return this.wbsService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une phase WBS' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.wbsService.remove(projectId, id);
  }
}
