import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class HistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 365 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  days?: number;

  @ApiPropertyOptional({ default: 24, minimum: 1, maximum: 8760 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8760)
  @IsOptional()
  hours?: number;
}
