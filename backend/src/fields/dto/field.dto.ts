import { IsString, IsNumber, IsDate, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GrowthStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateFieldDto {
  @ApiProperty({ example: 'North Block A1' })
  @IsString()
  name: string;

  @ApiProperty({ example: -7.2504 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 112.7688 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'Gading, Tambaksari, Surabaya', required: false })
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  @Min(0.1)
  areaHectares: number;

  @ApiProperty({ example: 'VMC 76-16' })
  @IsString()
  sugarcaneVariety: string;

  @ApiProperty({ example: '2024-03-15T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  plantingDate: Date;

  @ApiProperty({ enum: GrowthStatus, default: GrowthStatus.PLANTED })
  @IsEnum(GrowthStatus)
  @IsOptional()
  growthStatus?: GrowthStatus;
}

export class UpdateFieldDto extends PartialType(CreateFieldDto) {}

export class FieldFilterDto extends PaginationQueryDto {
  @ApiProperty({ enum: GrowthStatus, required: false })
  @IsEnum(GrowthStatus)
  @IsOptional()
  growthStatus?: GrowthStatus;
}

export class UpdateGrowthStatusDto {
  @ApiProperty({ enum: GrowthStatus })
  @IsEnum(GrowthStatus)
  status: GrowthStatus;
}

export class FieldResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty({ required: false })
  locationName?: string;

  @ApiProperty()
  areaHectares: number;

  @ApiProperty()
  sugarcaneVariety: string;

  @ApiProperty()
  plantingDate: Date;

  @ApiProperty({ enum: GrowthStatus })
  growthStatus: GrowthStatus;

  @ApiProperty()
  cropAgeDays: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
