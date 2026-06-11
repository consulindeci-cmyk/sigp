import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { CreateOperationDto, QueryOperationsDto } from './dto/operation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Journal des Opérations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une opération (déclenche mise à jour de la tâche liée)' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateOperationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.operationsService.create(projectId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste chronologique des opérations avec pagination' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryOperationsDto) {
    return this.operationsService.findAll(projectId, query);
  }

  @Get('by-task/:taskId')
  @ApiOperation({ summary: "Historique des opérations d'une tâche" })
  findByTask(@Param('projectId') projectId: string, @Param('taskId') taskId: string) {
    return this.operationsService.findByTask(projectId, taskId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une opération" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.operationsService.findOne(projectId, id);
  }
}
