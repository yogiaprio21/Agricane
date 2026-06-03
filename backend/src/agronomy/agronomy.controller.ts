import { Controller, Get, Query, UseGuards, ParseFloatPipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgronomyService } from './agronomy.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

@ApiTags('Agronomy & FAO Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agronomy')
export class AgronomyController {
  constructor(private readonly agronomyService: AgronomyService) {}

  @Get('fao/all')
  @ApiOperation({ summary: 'Get all FAO reference data' })
  @ApiResponse({ status: 200, description: 'All FAO references retrieved' })
  getAllReferences() {
    return this.agronomyService.getAllFAOReferences();
  }

  @Get('fao/sugarcane')
  @ApiOperation({ summary: 'Get comprehensive sugarcane guidelines from FAO' })
  @ApiResponse({ status: 200, description: 'Sugarcane guidelines retrieved' })
  getSugarcaneGuidelines() {
    return this.agronomyService.getSugarcaneGuidelines();
  }

  @Get('optimal-conditions')
  @ApiOperation({ summary: 'Get optimal growing conditions for a crop' })
  @ApiQuery({ name: 'crop', required: false, example: 'sugarcane' })
  @ApiResponse({ status: 200, description: 'Optimal conditions retrieved' })
  getOptimalConditions(@Query('crop') crop?: string) {
    return this.agronomyService.getOptimalConditions(crop || 'sugarcane');
  }

  @Get('irrigation-recommendations')
  @ApiOperation({ summary: 'Get irrigation recommendations based on current conditions' })
  @ApiQuery({ name: 'soilMoisture', required: true, type: 'number', example: 45 })
  @ApiQuery({ name: 'temperature', required: true, type: 'number', example: 28 })
  @ApiQuery({ name: 'cropAge', required: true, type: 'number', example: 120 })
  @ApiResponse({ status: 200, description: 'Irrigation recommendations generated' })
  getIrrigationRecommendations(
    @Query('soilMoisture', ParseFloatPipe) soilMoisture: number,
    @Query('temperature', ParseFloatPipe) temperature: number,
    @Query('cropAge', ParseIntPipe) cropAge: number,
  ) {
    return this.agronomyService.getIrrigationRecommendations(soilMoisture, temperature, cropAge);
  }

  @Get('soil-assessment')
  @ApiOperation({ summary: 'Get soil health assessment based on pH' })
  @ApiQuery({ name: 'soilPH', required: true, type: 'number', example: 6.5 })
  @ApiQuery({ name: 'organicMatter', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Soil assessment completed' })
  getSoilAssessment(
    @Query('soilPH', ParseFloatPipe) soilPH: number,
    @Query('organicMatter', new ParseFloatPipe({ optional: true })) organicMatter?: number,
  ) {
    return this.agronomyService.getSoilHealthAssessment(soilPH, organicMatter);
  }
}