import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FundingSourceType } from '@prisma/client';

export class CreateFundingSourceDto {
  @ApiProperty({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: 'Identifiant du projet',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({
    example: 'Banque Mondiale',
    maxLength: 255,
    description: 'Nom du bailleur ou de la source',
  })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({ enum: FundingSourceType, default: FundingSourceType.BAILLEUR })
  @IsOptional()
  @IsEnum(FundingSourceType, { message: 'Le type de source de financement est invalide' })
  type?: FundingSourceType;

  @ApiProperty({ example: 5000000000, description: 'Montant total de la source' })
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant: number;

  @ApiPropertyOptional({
    example: 75.5,
    minimum: 0,
    maximum: 100,
    description: 'Part en pourcentage',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le pourcentage est invalide' })
  @Min(0)
  @Max(100)
  pourcentage?: number;

  @ApiPropertyOptional({ example: 'XOF', maxLength: 3, description: 'Code devise ISO 4217' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  devise?: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: "Date d'accord (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString({}, { message: "La date d'accord est invalide" })
  dateAccord?: string;

  @ApiPropertyOptional({ example: '2030-12-31', description: "Date d'expiration (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString({}, { message: "La date d'expiration est invalide" })
  dateExpiry?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@worldbank.org', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  contact?: string;

  @ApiPropertyOptional({ example: 'Financement composante 1 du projet' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
