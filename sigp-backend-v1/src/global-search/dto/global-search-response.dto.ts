import { ApiProperty } from '@nestjs/swagger';
import { GlobalSearchItemDto } from './global-search-item.dto';

export class GlobalSearchResponseDto {
  @ApiProperty({ type: () => [GlobalSearchItemDto] })
  items: GlobalSearchItemDto[];

  @ApiProperty({ example: 5, description: 'Nombre de résultats retournés (max 20)' })
  total: number;

  @ApiProperty({ example: 'formation', description: 'Terme de recherche utilisé' })
  query: string;
}
