// src/iot/dto/sensor-reading.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SensorReadingDto {
  @ApiProperty({ description: 'Reading ID' })
  id: string;

  @ApiProperty({ description: 'Field ID' })
  fieldId: string;

  @ApiProperty({ description: 'Soil moisture percentage' })
  soilMoisture: number;

  @ApiProperty({ description: 'Soil pH level' })
  soilPH: number;

  @ApiProperty({ description: 'Soil temperature in Celsius' })
  soilTemperature: number;

  @ApiProperty({ description: 'Timestamp of the reading' })
  timestamp: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}