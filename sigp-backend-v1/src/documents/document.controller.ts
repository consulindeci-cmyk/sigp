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
  UseGuards,
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
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { ApiErrorResponse } from '@/shared/dto/api-response.dto';
import { ProjectAccessGuard } from '@/projects/guards/project-access.guard';
import { DocumentService, ActorContext } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DocumentListResponseDto } from './dto/document-list-response.dto';
import { DocumentVersionResponseDto } from './dto/document-version-response.dto';

@ApiTags('documents')
@UseGuards(ProjectAccessGuard)
@Controller({ path: 'documents', version: '1' })
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  private actor(user: AuthenticatedUser, req: Request): ActorContext {
    return {
      userId: user.id,
      ip: req.ip ?? (req.socket.remoteAddress as string | undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Liste paginée des documents projet' })
  @ApiOkResponse({ description: 'Liste paginée', type: DocumentListResponseDto })
  @ApiBadRequestResponse({ description: 'Paramètres de requête invalides', type: ApiErrorResponse })
  async findAll(@Query() query: DocumentQueryDto): Promise<DocumentListResponseDto> {
    return this.documentService.findAll(query);
  }

  @Get(':id')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Détail d'un document" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document trouvé', type: DocumentResponseDto })
  @ApiNotFoundResponse({ description: 'Document introuvable', type: ApiErrorResponse })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    return this.documentService.findOne(id);
  }

  @Post()
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(UserRole.COORDINATEUR, UserRole.CHARGE_PROGRAMME, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un document projet' })
  @ApiCreatedResponse({ description: 'Document créé', type: DocumentResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Projet introuvable', type: ApiErrorResponse })
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    return this.documentService.create(dto, this.actor(user, req));
  }

  @Patch(':id')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(UserRole.COORDINATEUR, UserRole.CHARGE_PROGRAMME, UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un document projet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document modifié', type: DocumentResponseDto })
  @ApiBadRequestResponse({ description: 'Données invalides', type: ApiErrorResponse })
  @ApiNotFoundResponse({ description: 'Document introuvable', type: ApiErrorResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    return this.documentService.update(id, dto, this.actor(user, req));
  }

  @Delete(':id')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(UserRole.COORDINATEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un document projet (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Document supprimé' })
  @ApiNotFoundResponse({ description: 'Document introuvable', type: ApiErrorResponse })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.documentService.remove(id, this.actor(user, req));
    return { message: 'Document supprimé' };
  }

  // ── Upload & Download Endpoints ─────────────────────────────────────────────

  @Post(':id/upload')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(UserRole.COORDINATEUR, UserRole.CHARGE_PROGRAMME, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: "Upload du fichier binaire associé à un document et création d'une version" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Fichier à uploader (max 25 Mo)' },
        notes: { type: 'string', description: 'Notes de version' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Fichier uploadé et version créée', type: DocumentResponseDto })
  @ApiBadRequestResponse({ description: 'Fichier trop volumineux ou type non autorisé', type: ApiErrorResponse })
  async uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    return this.documentService.uploadFile(id, file, this.actor(user, req), notes);
  }

  @Get(':id/download')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: 'Téléchargement de la version active (dernière en date) du document' })
  @ApiOkResponse({ description: 'Flux binaire du fichier (StreamableFile)' })
  @ApiNotFoundResponse({ description: 'Fichier introuvable', type: ApiErrorResponse })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { upload, stream } = await this.documentService.getDownloadStream(id);
    res.set({
      'Content-Type': upload.mime_type,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_name)}"`,
    });
    return new StreamableFile(stream);
  }

  // ── Versions Endpoints ──────────────────────────────────────────────────────

  @Get(':id/versions')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Liste de l'historique des versions du document" })
  @ApiOkResponse({ description: 'Liste des versions', type: [DocumentVersionResponseDto] })
  @ApiNotFoundResponse({ description: 'Document introuvable', type: ApiErrorResponse })
  async getVersions(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentVersionResponseDto[]> {
    return this.documentService.getVersions(id);
  }

  @Post(':id/versions')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(UserRole.COORDINATEUR, UserRole.CHARGE_PROGRAMME, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Ajouter une nouvelle version via un nouvel upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Nouveau fichier' },
        notes: { type: 'string', description: 'Notes de version' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Nouvelle version ajoutée', type: DocumentResponseDto })
  async addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    return this.documentService.uploadFile(id, file, this.actor(user, req), notes);
  }

  @Get(':id/versions/:versionNumber/download')
  @UseGuards(ProjectAccessGuard)
  @ApiAuth(
    UserRole.VIEWER,
    UserRole.ADMIN,
    UserRole.COORDINATEUR,
    UserRole.CHARGE_PROGRAMME,
    UserRole.FINANCIER,
    UserRole.AUDITEUR,
  )
  @ApiOperation({ summary: "Télécharger une version spécifique par son numéro d'historique" })
  @ApiOkResponse({ description: 'Flux binaire du fichier de la version demandée' })
  async downloadVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { upload, stream } = await this.documentService.getDownloadStream(id, versionNumber);
    res.set({
      'Content-Type': upload.mime_type,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_name)}"`,
    });
    return new StreamableFile(stream);
  }
}
