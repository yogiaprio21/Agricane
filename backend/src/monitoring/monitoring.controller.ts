import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorators';
import { CreateDroneFlightDto, UpdateDroneFlightDto } from './dto/drone-flight.dto';
import { HistoryQueryDto } from '../common/dto/history-query.dto';

@ApiTags('Monitoring (NDVI & Drone)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post('ndvi/fetch/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Fetch NDVI data from Copernicus for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 201, description: 'NDVI data fetched and saved' })
  fetchNDVI(@Param('fieldId') fieldId: string) {
    return this.monitoringService.fetchNDVIForField(fieldId);
  }

  @Get('ndvi/history/:fieldId')
  @ApiOperation({ summary: 'Get NDVI history for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'days', required: false, type: 'number', example: 30 })
  @ApiResponse({ status: 200, description: 'NDVI history retrieved' })
  getNDVIHistory(
    @Param('fieldId') fieldId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.monitoringService.getNDVIHistory(fieldId, query.days || 30, query);
  }

  @Get('health/trend/:fieldId')
  @ApiOperation({ summary: 'Get field health trend analysis' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Health trend calculated' })
  getHealthTrend(@Param('fieldId') fieldId: string) {
    return this.monitoringService.getFieldHealthTrend(fieldId);
  }

  @Get('health/summary')
  @ApiOperation({ summary: 'Get health summary for all fields' })
  @ApiResponse({ status: 200, description: 'Health summary retrieved' })
  getHealthSummary() {
    return this.monitoringService.getFieldHealthSummary();
  }

  @Post('drone/flights')
  @Roles(Role.ADMIN, Role.DRONE_OPERATOR, Role.MANAGER)
  @ApiOperation({ summary: 'Create drone flight log' })
  @ApiResponse({ status: 201, description: 'Drone flight created' })
  createDroneFlight(
    @Body() data: CreateDroneFlightDto,
    @CurrentUser() user: any,
  ) {
    return this.monitoringService.createDroneFlight({
      ...data,
      operatorId: data.operatorId || user.id,
    });
  }

  @Get('drone/flights/:fieldId')
  @ApiOperation({ summary: 'Get all drone flights for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Drone flights retrieved' })
  getDroneFlights(@Param('fieldId') fieldId: string, @Query() query: HistoryQueryDto) {
    return this.monitoringService.getDroneFlights(fieldId, query);
  }

  @Get('drone/flight/:id')
  @ApiOperation({ summary: 'Get drone flight by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Drone flight details' })
  getDroneFlight(@Param('id') id: string) {
    return this.monitoringService.getDroneFlightById(id);
  }

  @Patch('drone/flight/:id')
  @Roles(Role.ADMIN, Role.DRONE_OPERATOR)
  @ApiOperation({ summary: 'Update drone flight' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Drone flight updated' })
  updateDroneFlight(
    @Param('id') id: string,
    @Body() data: UpdateDroneFlightDto,
  ) {
    return this.monitoringService.updateDroneFlight(id, data);
  }

  @Delete('drone/flight/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete drone flight (Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Drone flight deleted' })
  deleteDroneFlight(@Param('id') id: string) {
    return this.monitoringService.deleteDroneFlight(id);
  }
}
