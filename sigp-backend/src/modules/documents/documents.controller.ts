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
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDto, QueryDocumentsDto } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TypeDocument } from '@prisma/client';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Uploader un document (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type_document: { type: 'string', enum: Object.values(TypeDocument) },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}-${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return cb(
            new BadRequestException(
              `Type de fichier non autorisé. Acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('type_document') typeDocument: TypeDocument,
  ) {
    return this.documentsService.upload(projectId, userId, file, typeDocument);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des documents avec filtre par type' })
  findAll(@Param('projectId') projectId: string, @Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(projectId, query);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un document' })
  async download(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const filePath = await this.documentsService.getFilePath(projectId, id);
    return res.download(filePath);
  }

  @Get(':id')
  @ApiOperation({ summary: "Métadonnées d'un document" })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.documentsService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Mettre à jour les métadonnées d'un document" })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(projectId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete (conserve le fichier physique)' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.documentsService.remove(projectId, id);
  }
}
