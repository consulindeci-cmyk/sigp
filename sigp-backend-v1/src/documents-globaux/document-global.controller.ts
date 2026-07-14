import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { DocumentGlobalService, ActorContext } from './document-global.service';
import { CreateDocumentGlobalDto } from './dto/create-document-global.dto';
import { UpdateDocumentGlobalDto } from './dto/update-document-global.dto';
import { DocumentGlobalQueryDto } from './dto/document-global-query.dto';
import { DocumentGlobalResponseDto } from './dto/document-global-response.dto';
import { DocumentGlobalListResponseDto } from './dto/document-global-list-response.dto';
import { DocumentGlobalVersionResponseDto } from './dto/document-global-version-response.dto';

@ApiTags('documents-globaux')
@ApiAuth()
@Controller({ path: 'documents-globaux', version: '1' })
export class DocumentGlobalController {
  constructor(private readonly documentGlobalService: DocumentGlobalService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des documents globaux' })
  @ApiOkResponse({ description: 'Liste paginée', type: DocumentGlobalListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres invalides', type: ApiErrorResponse })
  async findAll(@Query() query: DocumentGlobalQueryDto): Promise<DocumentGlobalListResponseDto> {
    return this.documentGlobalService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un document global" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document global trouvé', type: DocumentGlobalResponseDto })
  @ApiNotFoundResponse({ description: 'Document global introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentGlobalResponseDto> {
    return this.documentGlobalService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiAuth(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un document global' })
  @ApiCreatedResponse({ description: 'Document global créé', type: DocumentGlobalResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateDocumentGlobalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentGlobalResponseDto> {
    return this.documentGlobalService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiAuth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un document global' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document global modifié', type: DocumentGlobalResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Document global introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentGlobalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentGlobalResponseDto> {
    return this.documentGlobalService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiAuth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un document global (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document global supprimé' })
  @ApiNotFoundResponse({ description: 'Document global introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.documentGlobalService.remove(id, this.actor(user, req));
    return { message: 'Document global supprimé' };
  }

  // ── Upload & Download Endpoints ─────────────────────────────────────────────

  @Post(':id/upload')
  @Roles(UserRole.ADMIN)
  @ApiAuth(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: "Upload du fichier binaire associé à un document global et création d'une version" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Fichier à uploader (max 25 Mo)' },
        notes: { type: 'string', description: 'Notes de version' },
        date_version: { type: 'string', format: 'date', description: 'Date de validité de la version' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Fichier uploadé et version créée', type: DocumentGlobalResponseDto })
  @ApiBadRequestResponse({ description: 'Fichier trop volumineux ou type non autorisé', type: ApiErrorResponse })
  async uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string | undefined,
    @Body('date_version') dateVersion: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentGlobalResponseDto> {
    return this.documentGlobalService.uploadFile(id, file, this.actor(user, req), notes, dateVersion);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Téléchargement de la version active (dernière en date) du document global' })
  @ApiOkResponse({ description: 'Flux binaire du fichier (StreamableFile)' })
  @ApiNotFoundResponse({ description: 'Fichier introuvable', type: ApiErrorResponse })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { upload, stream } = await this.documentGlobalService.getDownloadStream(id);
    res.set({
      'Content-Type': upload.mime_type,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_name)}"`,
    });
    return new StreamableFile(stream);
  }

  // ── Versions Endpoints ──────────────────────────────────────────────────────

  @Get(':id/versions')
  @ApiOperation({ summary: "Liste de l'historique des versions du document global" })
  @ApiOkResponse({ description: 'Liste des versions', type: [DocumentGlobalVersionResponseDto] })
  @ApiNotFoundResponse({ description: 'Document global introuvable', type: ApiErrorResponse })
  async getVersions(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentGlobalVersionResponseDto[]> {
    return this.documentGlobalService.getVersions(id);
  }

  @Post(':id/versions')
  @Roles(UserRole.ADMIN)
  @ApiAuth(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Ajouter une nouvelle version au document global via un nouvel upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Nouveau fichier' },
        notes: { type: 'string', description: 'Notes de version' },
        date_version: { type: 'string', format: 'date', description: 'Date de validité de la version' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Nouvelle version ajoutée', type: DocumentGlobalResponseDto })
  async addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string | undefined,
    @Body('date_version') dateVersion: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentGlobalResponseDto> {
    return this.documentGlobalService.uploadFile(id, file, this.actor(user, req), notes, dateVersion);
  }

  @Get(':id/versions/:versionNumber/download')
  @ApiOperation({ summary: "Télécharger une version spécifique du document global par son numéro d'historique" })
  @ApiOkResponse({ description: 'Flux binaire du fichier de la version demandée' })
  async downloadVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { upload, stream } = await this.documentGlobalService.getDownloadStream(id, versionNumber);
    res.set({
      'Content-Type': upload.mime_type,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_name)}"`,
    });
    return new StreamableFile(stream);
  }
}
