import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { LogframeLevel } from '@prisma/client';

export class CreateLogframeObjectiveDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({ enum: LogframeLevel, description: 'Niveau du cadre logique' })
  @IsEnum(LogframeLevel, { message: 'Le niveau est invalide' })
  niveau: LogframeLevel;

  @ApiProperty({ example: 'OG-1', maxLength: 20, description: 'Code (normalisé en majuscules)' })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(20)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Améliorer l’accès aux soins en milieu rural', maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle: string;

  @ApiPropertyOptional({ example: 'Description détaillée de l’objectif' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: 'Objectif parent (hiérarchie du cadre logique)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif parent est invalide" })
  parentId?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Ordre d’affichage' })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  @Min(0)
  ordre?: number;
}
