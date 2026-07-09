import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateBudgetLineDto {
  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la ligne parente (hiérarchie)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne parente est invalide" })
  parentId?: string;

  @ApiPropertyOptional({ example: 'Personnel permanent révisé', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle?: string;

  @ApiPropertyOptional({ example: 'Ressources humaines', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  categorie?: string;

  @ApiPropertyOptional({ example: 55000000, description: 'Montant prévu révisé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant prévu est invalide' })
  @Min(0)
  montantPrevu?: number;

  @ApiPropertyOptional({ example: 12000000, description: 'Montant engagé révisé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant engagé est invalide' })
  @Min(0)
  montantEngage?: number;

  @ApiPropertyOptional({ example: 6000000, description: 'Montant payé révisé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant payé est invalide' })
  @Min(0)
  montantPaye?: number;

  @ApiPropertyOptional({ example: 2, description: "Ordre d'affichage révisé" })
  @IsOptional()
  @IsNumber({}, { message: "L'ordre est invalide" })
  @Min(0)
  ordre?: number;
}
