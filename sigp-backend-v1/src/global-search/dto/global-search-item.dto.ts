import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GlobalSearchItemDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'projects', description: 'Module source du résultat' })
  module: string;

  @ApiProperty({ example: 'Projet santé communautaire' })
  title: string;

  @ApiPropertyOptional({ example: 'PRJ-2026-001', nullable: true })
  subtitle: string | null;

  @ApiPropertyOptional({ example: 'EN_COURS', nullable: true })
  status: string | null;

  @ApiProperty({ example: '/api/v1/projects/a1b2c3d4-...' })
  url: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890', nullable: true })
  projectId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
