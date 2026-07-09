import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDepartementDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant de la direction parente (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant de la direction est invalide" })
  directionId: string;

  @ApiProperty({ example: 'DEP-SI', maxLength: 50, description: 'Code (normalisé en majuscules)' })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Département Systèmes d’Information', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({ example: 'Département en charge de l’infrastructure' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
