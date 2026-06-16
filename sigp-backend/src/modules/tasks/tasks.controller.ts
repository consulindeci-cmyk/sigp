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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Tâches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une tâche' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des tâches avec filtres et champs calculés' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryTasksDto) {
    return this.tasksService.findAll(projectId, query);
  }

  @Get('by-wbs/:wbsId')
  @ApiOperation({ summary: 'Tâches filtrées par phase WBS' })
  findByWbs(@Param('projectId') projectId: string, @Param('wbsId') wbsId: string) {
    return this.tasksService.findByWbs(projectId, wbsId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une tâche avec champs calculés" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.tasksService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une tâche' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.tasksService.remove(projectId, id);
  }
}
