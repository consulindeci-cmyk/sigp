import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePpmEtapeDto {
  @ApiPropertyOptional({ description: "Libellé de l'étape", maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  libelle?: string;

  @ApiPropertyOptional({ description: "Numéro d'ordre de l'étape", minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  ordre?: number;

  @ApiPropertyOptional({ description: 'Date prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  datePrevue?: string;

  @ApiPropertyOptional({ description: 'Date réelle (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateReelle?: string;

  @ApiPropertyOptional({ description: 'Étape complète' })
  @IsOptional()
  @IsBoolean()
  complete?: boolean;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
