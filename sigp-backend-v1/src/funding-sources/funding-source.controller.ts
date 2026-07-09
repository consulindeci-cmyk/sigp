import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { FundingSourceService, ActorContext } from './funding-source.service';
import { CreateFundingSourceDto } from './dto/create-funding-source.dto';
import { UpdateFundingSourceDto } from './dto/update-funding-source.dto';
import { FundingSourceQueryDto } from './dto/funding-source-query.dto';
import { FundingSourceResponseDto } from './dto/funding-source-response.dto';
import { FundingSourceListResponseDto } from './dto/funding-source-list-response.dto';

@ApiTags('funding-sources')
@ApiAuth(UserRole.ADMIN)
@Controller({ path: 'funding-sources', version: '1' })
export class FundingSourceController {
  constructor(private readonly fundingSourceService: FundingSourceService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des sources de financement' })
  @ApiOkResponse({ description: 'Liste paginée', type: FundingSourceListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: FundingSourceQueryDto): Promise<FundingSourceListResponseDto> {
    return this.fundingSourceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une source de financement" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Source trouvée', type: FundingSourceResponseDto })
  @ApiNotFoundResponse({ description: 'Source introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FundingSourceResponseDto> {
    return this.fundingSourceService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une source de financement' })
  @ApiCreatedResponse({ description: 'Source créée', type: FundingSourceResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateFundingSourceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<FundingSourceResponseDto> {
    return this.fundingSourceService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une source de financement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Source modifiée', type: FundingSourceResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Source introuvable', type: ApiErrorResponse })
  @ApiConflictResponse({ description: 'Conflit de données', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFundingSourceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<FundingSourceResponseDto> {
    return this.fundingSourceService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer (soft delete) une source de financement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Source supprimée (suppression logique)' })
  @ApiNotFoundResponse({ description: 'Source introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.fundingSourceService.remove(id, this.actor(user, req));
    return { message: 'Source de financement supprimée' };
  }
}
