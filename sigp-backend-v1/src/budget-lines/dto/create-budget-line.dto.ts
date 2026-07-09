import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBudgetLineDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la version budgétaire (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant de la version est invalide" })
  versionId: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la ligne parente (hiérarchie)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne parente est invalide" })
  parentId?: string;

  @ApiProperty({
    example: 'PERS-001',
    maxLength: 30,
    description: 'Code de la ligne budgétaire',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code de ligne est obligatoire' })
  @MaxLength(30)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  codeLigne: string;

  @ApiProperty({ example: 'Personnel permanent', maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle: string;

  @ApiPropertyOptional({ example: 'Ressources humaines', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  categorie?: string;

  @ApiPropertyOptional({ example: 50000000, description: 'Montant prévu' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant prévu est invalide' })
  @Min(0)
  montantPrevu?: number;

  @ApiPropertyOptional({ example: 10000000, description: 'Montant engagé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant engagé est invalide' })
  @Min(0)
  montantEngage?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Montant payé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant payé est invalide' })
  @Min(0)
  montantPaye?: number;

  @ApiPropertyOptional({ example: 1, description: "Ordre d'affichage" })
  @IsOptional()
  @IsNumber({}, { message: "L'ordre est invalide" })
  @Min(0)
  ordre?: number;
}
