import { ApiProperty } from '@nestjs/swagger';

export class ExportResponseDto {
  @ApiProperty({ description: 'Nom du fichier généré', example: 'sigp-projects-2026-07-08.pdf' })
  filename: string;

  @ApiProperty({ description: 'Format du fichier', example: 'pdf' })
  format: string;

  @ApiProperty({ description: 'Ressource exportée', example: 'projects' })
  resource: string;

  @ApiProperty({ description: "Nombre d'enregistrements exportés", example: 42 })
  records: number;

  @ApiProperty({ description: 'Taille estimée en Ko', example: 84 })
  estimatedSizeKb: number;

  @ApiProperty({ description: 'Date et heure de génération' })
  generatedAt: Date;

  @ApiProperty({
    description: 'URL de téléchargement simulée',
    example: '/api/v1/exports/download?resource=projects&format=pdf',
  })
  downloadUrl: string;
}
