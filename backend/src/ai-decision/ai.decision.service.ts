import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgronomyService } from '../agronomy/agronomy.service';
import { differenceInDays } from 'date-fns';
import { IotService } from '../iot/iot.service';
import { EnvironmentalService } from '../environmental/environmental.service';
import {
  IRRIGATION_RULES,
  HARVEST_RULES,
  RISK_THRESHOLDS,
} from '../common/constants/business-rules.constants';
import {
  createPaginatedResponse,
  getPagination,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class AiDecisionService {
  private readonly logger = new Logger(AiDecisionService.name);

  constructor(
    private prisma: PrismaService,
    private agronomyService: AgronomyService,
    private iotService: IotService,
    private environmentalService: EnvironmentalService,
  ) {}

  async getDecisionPrerequisites(fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        sensorReadings: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        weatherData: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
        },
        ndviData: {
          take: 1,
          orderBy: { captureDate: 'desc' },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const latestSensor = field.sensorReadings[0] || null;
    const latestWeather = field.weatherData[0] || null;
    const latestNDVI = field.ndviData[0] || null;
    const cropAge = differenceInDays(new Date(), new Date(field.plantingDate));

    const irrigationMissing = [];
    if (!latestSensor) irrigationMissing.push('latest_sensor_reading');
    if (!latestWeather) irrigationMissing.push('latest_weather_data');

    return {
      fieldId,
      cropAge,
      sourceMode: 'production',
      canGenerate: {
        irrigation: irrigationMissing.length === 0,
        harvestReadiness: true,
        riskAssessment: true,
      },
      missing: {
        irrigation: irrigationMissing,
        harvestReadiness: latestNDVI ? [] : ['latest_ndvi_optional'],
        riskAssessment: [
          ...(!latestSensor ? ['latest_sensor_reading_optional'] : []),
          ...(!latestWeather ? ['latest_weather_data_optional'] : []),
          ...(!latestNDVI ? ['latest_ndvi_optional'] : []),
        ],
      },
      latestData: {
        sensor: latestSensor
          ? {
              timestamp: latestSensor.timestamp,
              soilMoisture: latestSensor.soilMoisture,
              soilPH: latestSensor.soilPH,
              soilTemperature: latestSensor.soilTemperature,
            }
          : null,
        weather: latestWeather
          ? {
              recordedAt: latestWeather.recordedAt,
              temperature: latestWeather.temperature,
              humidity: latestWeather.humidity,
              rainfall: latestWeather.rainfall,
              source: latestWeather.source,
            }
          : null,
        ndvi: latestNDVI
          ? {
              captureDate: latestNDVI.captureDate,
              ndviValue: latestNDVI.ndviValue,
              healthStatus: latestNDVI.healthStatus,
              source: latestNDVI.source,
            }
          : null,
      },
    };
  }

  async generateIrrigationDecision(fieldId: string, options?: { demo?: boolean }) {
    let field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        sensorReadings: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        weatherData: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    if (options?.demo) {
      this.logger.log(
        `Generating demo recommendation for field ${fieldId}. Creating simulated sensor data and fetching weather.`,
      );
      await this.iotService.simulateSensorData(fieldId);
      await this.environmentalService.fetchWeatherForField(fieldId);

      field = await this.prisma.field.findUnique({
        where: { id: fieldId },
        include: {
          sensorReadings: {
            take: 10,
            orderBy: { timestamp: 'desc' },
          },
          weatherData: {
            take: 5,
            orderBy: { recordedAt: 'desc' },
          },
        },
      });
    }

    const latestSensor = field.sensorReadings[0];
    const latestWeather = field.weatherData[0];
    const cropAge = differenceInDays(new Date(), new Date(field.plantingDate));

    if (!latestSensor || !latestWeather) {
      throw new UnprocessableEntityException({
        message: 'Insufficient data for irrigation decision generation',
        missingData: [
          ...(!latestSensor ? ['latest_sensor_reading'] : []),
          ...(!latestWeather ? ['latest_weather_data'] : []),
        ],
        nextActions: [
          ...(!latestSensor ? ['Create a sensor reading or use IoT simulation explicitly.'] : []),
          ...(!latestWeather ? ['Fetch latest weather data for the field.'] : []),
        ],
      });
    }

    const faoRecommendation = await this.agronomyService.getIrrigationRecommendations(
      latestSensor.soilMoisture,
      latestWeather.temperature,
      cropAge,
    );

    let recommendation = '';
    let confidence = IRRIGATION_RULES.CONFIDENCE.LOW;
    let explanation = '';

    if (latestSensor.soilMoisture < IRRIGATION_RULES.MOISTURE.CRITICAL) {
      recommendation = 'IMMEDIATE_IRRIGATION_REQUIRED';
      confidence = IRRIGATION_RULES.CONFIDENCE.HIGH;
      explanation = `Critical soil moisture level detected at ${latestSensor.soilMoisture.toFixed(1)}%. Current temperature is ${latestWeather.temperature.toFixed(1)}°C. FAO guidelines recommend maintaining adequate moisture especially during the crop's growth stage (${cropAge} days old). Recent rainfall: ${latestWeather.rainfall}mm. Immediate irrigation is essential to prevent crop stress.`;
    } else if (latestSensor.soilMoisture < IRRIGATION_RULES.MOISTURE.WARNING) {
      recommendation = 'SCHEDULE_IRRIGATION_24H';
      confidence = IRRIGATION_RULES.CONFIDENCE.MEDIUM;
      explanation = `Soil moisture at ${latestSensor.soilMoisture.toFixed(1)}% is approaching critical levels. Temperature: ${latestWeather.temperature.toFixed(1)}°C. Crop age: ${cropAge} days. FAO crop coefficient for sugarcane is ${faoRecommendation.faoReference?.cropCoefficient || 1.05}. Schedule irrigation within 24 hours to maintain optimal growing conditions.`;
    } else if (latestSensor.soilMoisture > IRRIGATION_RULES.MOISTURE.EXCESS) {
      recommendation = 'REDUCE_IRRIGATION';
      confidence = IRRIGATION_RULES.CONFIDENCE.LOW;
      explanation = `Soil moisture is high at ${latestSensor.soilMoisture.toFixed(1)}%. Risk of waterlogging and root diseases. Recent rainfall: ${latestWeather.rainfall}mm. Ensure proper field drainage. Reduce or skip next irrigation cycle. Monitor for fungal diseases.`;
    } else {
      recommendation = 'MAINTAIN_CURRENT_SCHEDULE';
      confidence = IRRIGATION_RULES.CONFIDENCE.MEDIUM_HIGH;
      explanation = `Soil moisture optimal at ${latestSensor.soilMoisture.toFixed(1)}%. Temperature: ${latestWeather.temperature.toFixed(1)}°C. Crop age: ${cropAge} days. All parameters within FAO recommended ranges. Continue current irrigation schedule. Water use efficiency: ${faoRecommendation.faoReference?.efficiency || 0.75}.`;
    }

    const decision = await this.prisma.aIDecision.create({
      data: {
        fieldId,
        decisionType: 'IRRIGATION',
        recommendation,
        explanation,
        confidence,
        contextData: {
          cropAge,
          growthStatus: field.growthStatus,
          sourceMode: options?.demo ? 'demo' : 'production',
          inputSnapshot: {
            sensorReadingId: latestSensor.id,
            sensorTimestamp: latestSensor.timestamp,
            weatherDataId: latestWeather.id,
            weatherRecordedAt: latestWeather.recordedAt,
            weatherSource: latestWeather.source,
          },
        },
        weatherFactors: {
          temperature: latestWeather.temperature,
          humidity: latestWeather.humidity,
          rainfall: latestWeather.rainfall,
        },
        soilFactors: {
          moisture: latestSensor.soilMoisture,
          pH: latestSensor.soilPH,
          temperature: latestSensor.soilTemperature,
        },
        faoReferences: faoRecommendation.faoReference || null,
      },
    });

    return decision;
  }

  async generateHarvestReadinessDecision(fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        ndviData: {
          take: 5,
          orderBy: { captureDate: 'desc' },
        },
        sensorReadings: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const cropAge = differenceInDays(new Date(), new Date(field.plantingDate));
    const latestNDVI = field.ndviData[0];
    const avgSoilMoisture =
      field.sensorReadings.length > 0
        ? field.sensorReadings.reduce((sum, r) => sum + r.soilMoisture, 0) / field.sensorReadings.length
        : 0;

    let recommendation = '';
    let confidence = 0.80;
    let explanation = '';

    const optimalHarvestAge = HARVEST_RULES.AGE.OPTIMAL_TARGET;

    if (cropAge < HARVEST_RULES.AGE.TOO_EARLY_THRESHOLD) {
      recommendation = HARVEST_RULES.DECISIONS.TOO_EARLY;
      confidence = 0.92;
      explanation = `Crop is ${cropAge} days old. Sugarcane typically requires ${optimalHarvestAge} days to reach maturity. NDVI: ${latestNDVI?.ndviValue.toFixed(3) || 'N/A'}. Continue monitoring growth. Expected maturity in ${optimalHarvestAge - cropAge} days.`;
    } else if (cropAge >= HARVEST_RULES.AGE.TOO_EARLY_THRESHOLD && cropAge < HARVEST_RULES.AGE.MIN_OPTIMAL) {
      recommendation = HARVEST_RULES.DECISIONS.MONITOR;
      confidence = 0.85;
      explanation = `Crop is ${cropAge} days old, approaching maturity window. Current NDVI: ${latestNDVI?.ndviValue.toFixed(3) || 'N/A'}. Health status: ${latestNDVI?.healthStatus || 'Unknown'}. Monitor sugar content (Brix levels) weekly. Prepare harvest equipment and labor.`;
    } else if (cropAge >= HARVEST_RULES.AGE.MIN_OPTIMAL && cropAge <= HARVEST_RULES.AGE.MAX_OPTIMAL) {
      recommendation = HARVEST_RULES.DECISIONS.READY;
      confidence = 0.93;
      explanation = `Optimal harvest window reached at ${cropAge} days. NDVI: ${latestNDVI?.ndviValue.toFixed(3) || 'N/A'} indicates maturity. Average soil moisture: ${avgSoilMoisture.toFixed(1)}%. Recommend conducting Brix test to confirm sugar content ≥18%. Schedule harvest within 2-4 weeks for optimal sugar yield.`;
    } else {
      recommendation = HARVEST_RULES.DECISIONS.OVERDUE;
      confidence = 0.88;
      explanation = `Crop is ${cropAge} days old, beyond optimal harvest window (${optimalHarvestAge} days). Risk of sugar degradation and lodging. NDVI: ${latestNDVI?.ndviValue.toFixed(3) || 'N/A'}. Prioritize immediate harvest to minimize yield loss.`;
    }

    const decision = await this.prisma.aIDecision.create({
      data: {
        fieldId,
        decisionType: 'HARVEST_READINESS',
        recommendation,
        explanation,
        confidence,
        contextData: {
          cropAge,
          growthStatus: field.growthStatus,
          variety: field.sugarcaneVariety,
        },
        ndviFactors: latestNDVI
          ? {
              value: latestNDVI.ndviValue,
              healthStatus: latestNDVI.healthStatus,
              captureDate: latestNDVI.captureDate,
            }
          : null,
        soilFactors: {
          avgMoisture: avgSoilMoisture,
        },
      },
    });

    return decision;
  }

  async generateRiskAssessment(fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        weatherData: {
          take: 10,
          orderBy: { recordedAt: 'desc' },
        },
        sensorReadings: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        ndviData: {
          take: 5,
          orderBy: { captureDate: 'desc' },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const risks: string[] = [];
    const warnings: string[] = [];
    let overallRisk = 'LOW';

    const avgTemp =
      field.weatherData.length > 0
        ? field.weatherData.reduce((sum, w) => sum + w.temperature, 0) / field.weatherData.length
        : 0;

    const totalRainfall = field.weatherData.reduce((sum, w) => sum + w.rainfall, 0);

    if (avgTemp > RISK_THRESHOLDS.TEMPERATURE.HIGH) {
      risks.push('HEAT_STRESS');
      warnings.push(`High temperature stress detected. Average: ${avgTemp.toFixed(1)}°C. Consider increased irrigation frequency.`);
      overallRisk = 'HIGH';
    }

    if (totalRainfall > RISK_THRESHOLDS.RAINFALL.EXCESS) {
      risks.push('EXCESS_RAINFALL');
      warnings.push(`Excessive rainfall detected: ${totalRainfall.toFixed(1)}mm in recent period. Monitor for waterlogging and fungal diseases.`);
      if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
    }

    if (field.sensorReadings.length > 0) {
      const latestPH = field.sensorReadings[0].soilPH;
      if (latestPH < RISK_THRESHOLDS.SOIL_PH.MIN || latestPH > RISK_THRESHOLDS.SOIL_PH.MAX) {
        risks.push('SOIL_PH_IMBALANCE');
        warnings.push(`Soil pH is ${latestPH.toFixed(2)}, outside optimal range (${RISK_THRESHOLDS.SOIL_PH.MIN}-${RISK_THRESHOLDS.SOIL_PH.MAX}). May affect nutrient availability.`);
        if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
      }
    }

    if (field.ndviData.length > 0 && field.ndviData[0].healthStatus === 'SEVERE_STRESS') {
      risks.push('VEGETATION_STRESS');
      warnings.push(`NDVI indicates severe vegetation stress: ${field.ndviData[0].ndviValue.toFixed(3)}. Investigate potential pest or disease issues.`);
      overallRisk = 'HIGH';
    }

    const explanation =
      risks.length > 0
        ? `Risk assessment identified ${risks.length} concern(s): ${warnings.join(' | ')}`
        : 'No significant risks detected. Field conditions are within optimal parameters.';

    const decision = await this.prisma.aIDecision.create({
      data: {
        fieldId,
        decisionType: 'RISK_ASSESSMENT',
        recommendation: overallRisk,
        explanation,
        confidence: 0.87,
        contextData: {
          risks,
          warnings,
        },
        weatherFactors: {
          avgTemperature: avgTemp,
          totalRainfall,
        },
        soilFactors: field.sensorReadings[0]
          ? {
              pH: field.sensorReadings[0].soilPH,
              moisture: field.sensorReadings[0].soilMoisture,
            }
          : null,
        ndviFactors: field.ndviData[0]
          ? {
              value: field.ndviData[0].ndviValue,
              status: field.ndviData[0].healthStatus,
            }
          : null,
      },
    });

    return decision;
  }

  async getDecisionHistory(fieldId: string, query?: PaginationQueryDto) {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const where = { fieldId };
    const [data, total] = await Promise.all([
      this.prisma.aIDecision.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.aIDecision.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async getDecisionsByType(fieldId: string, type: string) {
    return this.prisma.aIDecision.findMany({
      where: {
        fieldId,
        decisionType: type,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
