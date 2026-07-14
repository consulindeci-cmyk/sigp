import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentGlobalVersion, Upload } from '@prisma/client';
import { UploadResponseDto } from '@/uploads/dto/upload-response.dto';

export type DocumentGlobalVersionWithUpload = DocumentGlobalVersion & {
  upload?: Upload | null;
  authorName?: string | null;
};

export class DocumentGlobalVersionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la version' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID du document global parent' })
  documentId: string;

  @ApiProperty({ example: 1, description: 'Numéro de la version (auto-incrémenté)' })
  numeroVersion: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: "ID de l'upload physique associé" })
  uploadId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Date de validité de la version (date_version)' })
  dateVersion: string;

  @ApiPropertyOptional({ example: 'Nouvelle version du manuel de procédure', description: 'Notes de version' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Créateur de la version' })
  createdBy?: string | null;

  @ApiPropertyOptional({ example: 'SIGP Admin', description: 'Nom complet du créateur de la version' })
  authorName?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Date de création technique' })
  createdAt: string;

  @ApiPropertyOptional({ type: () => UploadResponseDto, description: 'Détail du fichier uploadé' })
  upload?: UploadResponseDto | null;

  @ApiPropertyOptional({ example: '/api/v1/documents-globaux/123e4567-e89b-12d3-a456-426614174000/versions/1/download', description: 'URL de téléchargement directe de la version' })
  downloadUrl?: string | null;

  static fromEntity(entity: DocumentGlobalVersionWithUpload): DocumentGlobalVersionResponseDto {
    const docId = entity.document_id;
    return {
      id: entity.id,
      documentId: docId,
      numeroVersion: entity.numero_version,
      uploadId: entity.upload_id,
      dateVersion: entity.date_version instanceof Date ? entity.date_version.toISOString().split('T')[0] : String(entity.date_version),
      notes: entity.notes ?? null,
      createdBy: entity.created_by ?? null,
      authorName: entity.authorName ?? null,
      createdAt: entity.created_at instanceof Date ? entity.created_at.toISOString() : String(entity.created_at),
      upload: entity.upload ? UploadResponseDto.fromEntity(entity.upload) : null,
      downloadUrl: docId ? `/api/v1/documents-globaux/${docId}/versions/${entity.numero_version}/download` : null,
    };
  }
}
