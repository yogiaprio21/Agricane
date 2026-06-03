import { Controller, Get, Param, Query, Post, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnvironmentalService } from './environmental.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { HistoryQueryDto } from '../common/dto/history-query.dto';

@ApiTags('Environmental Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('environmental')
export class EnvironmentalController {
  constructor(private readonly environmentalService: EnvironmentalService) {}

  @Post('fetch/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Fetch current weather data for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Weather data fetched and saved' })
  fetchWeather(@Param('fieldId') fieldId: string) {
    return this.environmentalService.fetchWeatherForField(fieldId);
  }

  @Post('fetch-all')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Fetch weather data for all fields' })
  @ApiResponse({ status: 200, description: 'Weather data fetched for all fields' })
  fetchAllWeather() {
    return this.environmentalService.fetchWeatherForAllFields();
  }

  @Get('history/:fieldId')
  @ApiOperation({ summary: 'Get weather history for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'days', required: false, type: 'number', example: 7 })
  @ApiResponse({ status: 200, description: 'Weather history retrieved' })
  getHistory(
    @Param('fieldId') fieldId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.environmentalService.getWeatherHistory(fieldId, query.days || 7, query);
  }

  @Get('stats/:fieldId')
  @ApiOperation({ summary: 'Get weather statistics for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'days', required: false, type: 'number', example: 30 })
  @ApiResponse({ status: 200, description: 'Weather statistics calculated' })
  getStats(
    @Param('fieldId') fieldId: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.environmentalService.getWeatherStats(fieldId, days || 30);
  }

  @Get('forecast/:fieldId')
  @ApiOperation({ summary: 'Get weather forecast for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'slots', required: false, type: 'number', example: 8, description: '3-hour forecast slots, max 40' })
  @ApiResponse({ status: 200, description: 'Weather forecast retrieved' })
  getForecast(
    @Param('fieldId') fieldId: string,
    @Query('slots', new ParseIntPipe({ optional: true })) slots?: number,
  ) {
    return this.environmentalService.getForecast(fieldId, slots);
  }
}
