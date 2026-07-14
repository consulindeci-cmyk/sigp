import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentGlobal, DocumentStatus } from '@prisma/client';
import { DocumentGlobalVersionWithUpload, DocumentGlobalVersionResponseDto } from './document-global-version-response.dto';

export type DocumentGlobalWithVersions = DocumentGlobal & {
  versions?: DocumentGlobalVersionWithUpload[] | null;
  authorName?: string | null;
};

export class DocumentGlobalResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID unique du document global' })
  id: string;

  @ApiProperty({ example: 'Politique de sécurité informatique', description: 'Titre du document' })
  titre: string;

  @ApiPropertyOptional({ example: 'Politique institutionnelle de sécurité', description: 'Description' })
  description: string | null;

  @ApiPropertyOptional({ example: 'Administration', description: 'Catégorie du document global' })
  categorie: string | null;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.VALIDE, description: 'Statut de validation' })
  statut: DocumentStatus;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID du créateur' })
  createdBy: string | null;

  @ApiPropertyOptional({ example: 'SIGP Admin', description: 'Nom complet du créateur du document global' })
  authorName?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID du modificateur' })
  updatedBy: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Date de création' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Date de dernière modification' })
  updatedAt: string;

  @ApiPropertyOptional({ example: 2, description: 'Numéro de la version active' })
  latestVersionNumber?: number | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: "ID du fichier uploadé courant" })
  latestUploadId?: string | null;

  @ApiPropertyOptional({ example: 'politique_securite.pdf', description: 'Nom original du fichier' })
  fileName?: string | null;

  @ApiPropertyOptional({ example: 1048576, description: 'Taille du fichier en octets' })
  fileSize?: number | null;

  @ApiPropertyOptional({ example: 'application/pdf', description: 'Type MIME' })
  mimeType?: string | null;

  @ApiPropertyOptional({ example: '/api/v1/documents-globaux/123e4567-e89b-12d3-a456-426614174000/download', description: 'URL de téléchargement directe' })
  downloadUrl?: string | null;

  @ApiPropertyOptional({ type: () => [DocumentGlobalVersionResponseDto], description: 'Historique des versions' })
  versions?: DocumentGlobalVersionResponseDto[] | null;

  static fromEntity(entity: DocumentGlobalWithVersions): DocumentGlobalResponseDto {
    const versions = entity.versions && Array.isArray(entity.versions)
      ? [...entity.versions].sort((a, b) => b.numero_version - a.numero_version)
      : [];

    const latestVersion = versions.length > 0 ? versions[0] : null;
    const latestUpload = latestVersion?.upload;

    return {
      id: entity.id,
      titre: entity.titre,
      description: entity.description ?? null,
      categorie: entity.categorie ?? null,
      statut: entity.statut,
      createdBy: entity.created_by ?? null,
      authorName: entity.authorName ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at instanceof Date ? entity.created_at.toISOString() : String(entity.created_at),
      updatedAt: entity.updated_at instanceof Date ? entity.updated_at.toISOString() : String(entity.updated_at),
      latestVersionNumber: latestVersion ? latestVersion.numero_version : null,
      latestUploadId: latestVersion ? latestVersion.upload_id : null,
      fileName: latestUpload ? latestUpload.original_name : null,
      fileSize: latestUpload ? Number(latestUpload.size_bytes) : null,
      mimeType: latestUpload ? latestUpload.mime_type : null,
      downloadUrl: `/api/v1/documents-globaux/${entity.id}/download`,
      versions: versions.map(v => DocumentGlobalVersionResponseDto.fromEntity(v)),
    };
  }
}
