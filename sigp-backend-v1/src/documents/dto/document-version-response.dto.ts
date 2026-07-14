import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentProjetVersion, Upload } from '@prisma/client';
import { UploadResponseDto } from '@/uploads/dto/upload-response.dto';

export type DocumentProjetVersionWithUpload = DocumentProjetVersion & {
  upload?: Upload | null;
  authorName?: string | null;
};

export class DocumentVersionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la version' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID du document parent' })
  documentId: string;

  @ApiProperty({ example: 1, description: 'Numéro de la version (auto-incrémenté)' })
  numeroVersion: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: "ID de l'upload physique associé" })
  uploadId: string;

  @ApiPropertyOptional({ example: 'Mise à jour des annexes financières', description: 'Notes de version' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Créateur de la version' })
  createdBy?: string | null;

  @ApiPropertyOptional({ example: 'SIGP Coordonnateur', description: 'Nom complet du créateur de la version' })
  authorName?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Date de création de la version' })
  createdAt: string;

  @ApiPropertyOptional({ type: () => UploadResponseDto, description: 'Détail du fichier uploadé' })
  upload?: UploadResponseDto | null;

  @ApiPropertyOptional({ example: '/api/v1/documents/123e4567-e89b-12d3-a456-426614174000/versions/1/download', description: 'URL de téléchargement directe de la version' })
  downloadUrl?: string | null;

  static fromEntity(entity: DocumentProjetVersionWithUpload): DocumentVersionResponseDto {
    const docId = entity.document_id;
    return {
      id: entity.id,
      documentId: docId,
      numeroVersion: entity.numero_version,
      uploadId: entity.upload_id,
      notes: entity.notes ?? null,
      createdBy: entity.created_by ?? null,
      authorName: entity.authorName ?? null,
      createdAt: entity.created_at instanceof Date ? entity.created_at.toISOString() : String(entity.created_at),
      upload: entity.upload ? UploadResponseDto.fromEntity(entity.upload) : null,
      downloadUrl: docId ? `/api/v1/documents/${docId}/versions/${entity.numero_version}/download` : null,
    };
  }
}
