import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeDocument } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ enum: TypeDocument })
  @IsOptional()
  @IsEnum(TypeDocument)
  type_document?: TypeDocument;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;
}

export class QueryDocumentsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TypeDocument })
  @IsOptional()
  @IsEnum(TypeDocument)
  type_document?: TypeDocument;
}
