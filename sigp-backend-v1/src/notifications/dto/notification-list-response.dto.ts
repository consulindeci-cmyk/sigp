import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

class NotificationPaginationMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] }) data: NotificationResponseDto[];
  @ApiProperty({ type: NotificationPaginationMetaDto }) meta: NotificationPaginationMetaDto;
}
