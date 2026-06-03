// src/iot/dto/create-sensor-reading.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class CreateSensorReadingDto {
  @ApiProperty({
    description: 'Field ID',
    example: '78e9399a-0185-43ee-8592-e4f392feaa8a',
  })
  @IsUUID()
  @IsString()
  fieldId: string;

  @ApiProperty({
    description: 'Soil moisture percentage',
    example: 45.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  soilMoisture: number;

  @ApiProperty({
    description: 'Soil pH level',
    example: 6.8,
    minimum: 0,
    maximum: 14,
  })
  @IsNumber()
  @Min(0)
  @Max(14)
  soilPH: number;

  @ApiProperty({
    description: 'Soil temperature in Celsius',
    example: 28.3,
    minimum: -10,
    maximum: 60,
  })
  @IsNumber()
  @Min(-10)
  @Max(60)
  soilTemperature: number;
}