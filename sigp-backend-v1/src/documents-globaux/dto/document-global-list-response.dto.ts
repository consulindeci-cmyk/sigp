import { ApiProperty } from '@nestjs/swagger';
import { DocumentPaginationMetaDto } from '@/documents/dto/document-list-response.dto';
import { DocumentGlobalResponseDto } from './document-global-response.dto';

export class DocumentGlobalListResponseDto {
  @ApiProperty({ type: [DocumentGlobalResponseDto] })
  data: DocumentGlobalResponseDto[];

  @ApiProperty({ type: DocumentPaginationMetaDto })
  meta: DocumentPaginationMetaDto;
}
