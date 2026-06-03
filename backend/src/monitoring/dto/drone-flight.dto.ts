import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateDroneFlightDto {
  @ApiProperty({ example: '78e9399a-0185-43ee-8592-e4f392feaa8a' })
  @IsUUID()
  fieldId: string;

  @ApiProperty({ required: false, example: '78e9399a-0185-43ee-8592-e4f392feaa8a' })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: '2026-06-02T08:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  flightDate: Date;

  @ApiProperty({ example: 35, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 120, minimum: 1, maximum: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  altitudeMeters: number;

  @ApiProperty({ required: false, example: 'Healthy canopy coverage observed.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, example: 42, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  imageCount?: number;
}

export class UpdateDroneFlightDto extends PartialType(CreateDroneFlightDto) {}
