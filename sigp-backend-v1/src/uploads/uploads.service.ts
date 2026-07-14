import { Injectable } from '@nestjs/common';
import { Prisma, Upload } from '@prisma/client';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { UploadRepository } from './uploads.repository';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Mo

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.zip'
]);

@Injectable()
export class UploadsService {
  private readonly storageDir: string;

  constructor(private readonly uploadRepository: UploadRepository) {
    this.storageDir = path.resolve(process.cwd(), 'storage', 'uploads');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, userId: string, tx?: Prisma.TransactionClient): Promise<Upload> {
    if (!file) {
      throw new BadRequestException(ErrorCode.VALIDATION_ERROR, 'Aucun fichier fourni pour le téléversement.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        ErrorCode.UPLOAD_FILE_TOO_LARGE,
        `Le fichier dépasse la taille maximale autorisée (25 Mo). Taille actuelle : ${(file.size / (1024 * 1024)).toFixed(2)} Mo.`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        ErrorCode.UPLOAD_MIME_NOT_ALLOWED,
        `Le type ou l'extension du fichier n'est pas autorisé. Extensions admises : PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, PNG, JPG, JPEG, ZIP.`,
      );
    }

    const storedName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.storageDir, storedName);

    fs.writeFileSync(filePath, file.buffer);

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    return this.uploadRepository.create(
      {
        original_name: file.originalname.slice(0, 500),
        stored_name: storedName.slice(0, 500),
        mime_type: file.mimetype.slice(0, 100),
        size_bytes: BigInt(file.size),
        sha256,
        bucket: 'local',
        key: filePath.slice(0, 500),
        uploaded_by: userId,
      },
      tx,
    );
  }

  async getFileStream(uploadId: string, tx?: Prisma.TransactionClient): Promise<{ upload: Upload; stream: fs.ReadStream }> {
    const upload = await this.uploadRepository.findById(uploadId, tx);
    if (!upload) {
      throw new NotFoundException(ErrorCode.UPLOAD_NOT_FOUND, `Fichier uploadé non trouvé (ID: ${uploadId}).`);
    }

    if (!fs.existsSync(upload.key)) {
      throw new NotFoundException(
        ErrorCode.UPLOAD_NOT_FOUND,
        `Le fichier physique est introuvable sur le serveur de stockage.`,
      );
    }

    const stream = fs.createReadStream(upload.key);
    return { upload, stream };
  }
}
