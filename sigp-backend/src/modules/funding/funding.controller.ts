import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FundingService } from './funding.service';
import { CreateFundingDto, UpdateFundingDto } from './dto/funding.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Sources de Financement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/funding')
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une source de financement' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateFundingDto) {
    return this.fundingService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des sources de financement' })
  findAll(@Param('projectId') projectId: string) {
    return this.fundingService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une source de financement" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.fundingService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une source de financement' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFundingDto,
  ) {
    return this.fundingService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) une source de financement' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.fundingService.remove(projectId, id);
  }
}
