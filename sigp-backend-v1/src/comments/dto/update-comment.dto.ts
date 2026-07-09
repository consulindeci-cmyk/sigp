import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champs modifiables : message, statut, priorite, piece_jointe, mention, lu.
 * project_id, user_id, parent_id et module sont immuables après création.
 */
export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Contenu mis à jour' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @MaxLength(10000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  message?: string;

  @ApiPropertyOptional({ example: 'RESOLU' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statut?: string;

  @ApiPropertyOptional({ example: 'HAUTE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  priorite?: string;

  @ApiPropertyOptional({ example: 'nouveau_doc.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  piece_jointe?: string | null;

  @ApiPropertyOptional({ example: '@Fatoumata Koné' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  mention?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  lu?: boolean;
}
