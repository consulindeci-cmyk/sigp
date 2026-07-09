import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({
    example: 'Projet',
    description: 'Module concerné par le commentaire',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  module?: string;

  @ApiPropertyOptional({ example: 'PRJ-001', description: "Identifiant de l'élément" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  element_id?: string;

  @ApiPropertyOptional({ example: 'Informations générales', description: "Nom de l'élément" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  element_nom?: string;

  @ApiProperty({ example: 'Commentaire sur le projet', description: 'Contenu du commentaire' })
  @IsString()
  @IsNotEmpty({ message: 'Le message est obligatoire' })
  @MaxLength(10000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  message: string;

  @ApiPropertyOptional({ example: 'OUVERT', description: 'Statut du commentaire' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statut?: string;

  @ApiPropertyOptional({ example: 'NORMALE', description: 'Priorité du commentaire' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  priorite?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: 'Commentaire parent (réponse)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du commentaire parent est invalide" })
  parent_id?: string | null;

  @ApiPropertyOptional({ example: 'document.pdf', description: 'Nom du fichier joint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  piece_jointe?: string | null;

  @ApiPropertyOptional({ example: '@Amadou Diallo', description: "Mention d'un utilisateur" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  mention?: string | null;

  @ApiPropertyOptional({ example: false, description: 'Marquer comme lu' })
  @IsOptional()
  @IsBoolean()
  lu?: boolean;
}
