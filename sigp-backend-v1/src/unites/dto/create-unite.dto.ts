import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUniteDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du département parent (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du département est invalide" })
  departementId: string;

  @ApiProperty({
    example: 'UNI-RESEAU',
    maxLength: 50,
    description: 'Code (normalisé en majuscules)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Unité Réseau', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({ example: 'Unité en charge du réseau et des télécoms' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
