import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePpmEtapeDto {
  @ApiProperty({ description: 'Identifiant du marché PPM' })
  @IsUUID()
  marcheId: string;

  @ApiProperty({ description: "Libellé de l'étape", maxLength: 200 })
  @IsString()
  @MaxLength(200)
  libelle: string;

  @ApiProperty({ description: "Numéro d'ordre de l'étape", minimum: 1 })
  @IsInt()
  @IsPositive()
  ordre: number;

  @ApiPropertyOptional({ description: 'Date prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  datePrevue?: string;

  @ApiPropertyOptional({ description: 'Date réelle (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateReelle?: string;

  @ApiPropertyOptional({ description: 'Étape complète', default: false })
  @IsOptional()
  @IsBoolean()
  complete?: boolean;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
