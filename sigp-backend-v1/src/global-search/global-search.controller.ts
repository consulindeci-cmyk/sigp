import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchQueryDto } from './dto/global-search-query.dto';
import { GlobalSearchResponseDto } from './dto/global-search-response.dto';

@ApiTags('Search')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'search', version: '1' })
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Recherche globale transversale sur tous les modules SIGP' })
  @ApiOkResponse({ description: 'Résultats de recherche', type: GlobalSearchResponseDto })
  @ApiBadRequestResponse({ description: 'Terme de recherche invalide', type: ApiErrorResponse })
  search(@Query() query: GlobalSearchQueryDto): Promise<GlobalSearchResponseDto> {
    return this.globalSearchService.search(query);
  }
}
