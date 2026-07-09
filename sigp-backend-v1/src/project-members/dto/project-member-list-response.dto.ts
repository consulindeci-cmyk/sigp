import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberResponseDto } from './project-member-response.dto';

export class ProjectMemberPaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

/** Réponse paginée standardisée de la liste des membres de projet. */
export class ProjectMemberListResponseDto {
  @ApiProperty({ type: [ProjectMemberResponseDto] })
  data: ProjectMemberResponseDto[];

  @ApiProperty({ type: ProjectMemberPaginationMetaDto })
  meta: ProjectMemberPaginationMetaDto;
}
