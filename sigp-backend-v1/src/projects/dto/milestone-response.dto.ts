import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MilestoneResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() titre: string;
  @ApiPropertyOptional({ nullable: true }) datePrevue: string | null;
  @ApiProperty() statut: string;
}
