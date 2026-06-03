// src/iot/iot.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IotService } from './iot.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateSensorReadingDto } from './dto/create-sensor-reading.dto';
import { SensorReadingDto } from './dto/sensor-reading.dto';
import { HistoryQueryDto } from '../common/dto/history-query.dto';

@ApiTags('IoT Sensors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Post('readings')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Create new sensor reading' })
  @ApiResponse({ 
    status: 201, 
    description: 'Sensor reading created successfully',
    type: SensorReadingDto,
  })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createSensorReadingDto: CreateSensorReadingDto) {
    return this.iotService.createSensorReading(createSensorReadingDto);
  }

  @Get('readings/:fieldId/latest')
  @ApiOperation({ summary: 'Get latest sensor readings for a field' })
  @ApiParam({ name: 'fieldId', type: 'string', description: 'Field UUID' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Latest readings retrieved',
    type: [SensorReadingDto],
  })
  getLatest(
    @Param('fieldId') fieldId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.iotService.getLatestReadings(fieldId, limit || 20);
  }

  @Get('readings/:fieldId/history')
  @ApiOperation({ summary: 'Get sensor history for a field' })
  @ApiParam({ name: 'fieldId', type: 'string', description: 'Field UUID' })
  @ApiQuery({ 
    name: 'hours', 
    required: false, 
    type: 'number', 
    example: 24,
    description: 'Number of hours to look back',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sensor history retrieved',
    type: [SensorReadingDto],
  })
  getHistory(
    @Param('fieldId') fieldId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.iotService.getSensorHistory(fieldId, query.hours || 24, query);
  }

  @Get('readings/:fieldId/stats')
  @ApiOperation({ summary: 'Get sensor statistics for a field' })
  @ApiParam({ name: 'fieldId', type: 'string', description: 'Field UUID' })
  @ApiQuery({ 
    name: 'hours', 
    required: false, 
    type: 'number', 
    example: 24,
    description: 'Number of hours to calculate stats',
  })
  @ApiResponse({ status: 200, description: 'Sensor statistics calculated' })
  getStats(
    @Param('fieldId') fieldId: string,
    @Query('hours', new ParseIntPipe({ optional: true })) hours?: number,
  ) {
    return this.iotService.getSensorStats(fieldId, hours || 24);
  }

  @Get('readings/:fieldId/anomalies')
  @ApiOperation({ summary: 'Get anomalous sensor readings' })
  @ApiParam({ name: 'fieldId', type: 'string', description: 'Field UUID' })
  @ApiQuery({ 
    name: 'hours', 
    required: false, 
    type: 'number', 
    example: 24,
    description: 'Number of hours to check for anomalies',
  })
  @ApiResponse({ status: 200, description: 'Anomalous readings retrieved' })
  getAnomalies(
    @Param('fieldId') fieldId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.iotService.getAnomalousReadings(fieldId, query.hours || 24, query);
  }

  @Post('simulate/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER, Role.TECHNICIAN)
  @ApiOperation({ 
    summary: 'Simulate sensor data for testing',
    description: 'Generates random sensor data for the specified field',
  })
  @ApiParam({ name: 'fieldId', type: 'string', description: 'Field UUID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Simulated data created',
    type: SensorReadingDto,
  })
  simulate(@Param('fieldId') fieldId: string) {
    return this.iotService.simulateSensorData(fieldId);
  }
}
