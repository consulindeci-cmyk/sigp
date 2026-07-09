import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiSuccessResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  meta?: Record<string, unknown>;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'PROJ_001' })
  code: string;

  @ApiProperty({ example: 'Project not found' })
  message: string;

  @ApiPropertyOptional()
  errors?: unknown[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/projects/123' })
  path: string;
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
  return { success: true, data, meta, timestamp: new Date().toISOString() };
}
