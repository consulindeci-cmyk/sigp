import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Upload } from '@prisma/client';

export class UploadResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID unique du fichier uploadé' })
  id: string;

  @ApiProperty({ example: 'rapport_annuel.pdf', description: 'Nom original du fichier' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf', description: 'Type MIME du fichier' })
  mimeType: string;

  @ApiProperty({ example: 1048576, description: 'Taille du fichier en octets' })
  sizeBytes: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4...', description: 'Hash SHA256 du fichier pour intégrité' })
  sha256?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de l\'utilisateur ayant uploadé' })
  uploadedBy?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: "Date d'upload" })
  createdAt: string;

  static fromEntity(entity: Upload): UploadResponseDto {
    return {
      id: entity.id,
      originalName: entity.original_name,
      mimeType: entity.mime_type,
      sizeBytes: Number(entity.size_bytes),
      sha256: entity.sha256,
      uploadedBy: entity.uploaded_by,
      createdAt: entity.created_at instanceof Date ? entity.created_at.toISOString() : String(entity.created_at),
    };
  }
}
