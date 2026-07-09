import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FundingSourceType } from '@prisma/client';

export class UpdateFundingSourceDto {
  @ApiPropertyOptional({ example: 'Banque Mondiale', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ enum: FundingSourceType })
  @IsOptional()
  @IsEnum(FundingSourceType, { message: 'Le type de source de financement est invalide' })
  type?: FundingSourceType;

  @ApiPropertyOptional({ example: 5000000000, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant?: number;

  @ApiPropertyOptional({ example: 75.5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({}, { message: 'Le pourcentage est invalide' })
  @Min(0)
  @Max(100)
  pourcentage?: number;

  @ApiPropertyOptional({ example: 'XOF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  devise?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString({}, { message: "La date d'accord est invalide" })
  dateAccord?: string;

  @ApiPropertyOptional({ example: '2030-12-31' })
  @IsOptional()
  @IsDateString({}, { message: "La date d'expiration est invalide" })
  dateExpiry?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@worldbank.org', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  contact?: string;

  @ApiPropertyOptional({ example: 'Notes de suivi' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
