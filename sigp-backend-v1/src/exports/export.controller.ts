import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { ExportResponseDto } from './dto/export-response.dto';

@ApiTags('Exports')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'exports', version: '1' })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @ApiOperation({ summary: 'Prépare un export de données SIGP (métadonnées uniquement)' })
  @ApiOkResponse({ description: "Métadonnées de l'export générées", type: ExportResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres invalides', type: ApiErrorResponse })
  export(@Query() query: ExportQueryDto): Promise<ExportResponseDto> {
    return this.exportService.export(query);
  }

  @Get('download')
  @ApiOperation({ summary: "Téléchargement simulé d'un export SIGP (métadonnées uniquement)" })
  @ApiOkResponse({ description: 'Métadonnées du téléchargement générées', type: ExportResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres invalides', type: ApiErrorResponse })
  download(@Query() query: ExportQueryDto): Promise<ExportResponseDto> {
    return this.exportService.download(query);
  }
}
