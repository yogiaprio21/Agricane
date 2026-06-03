import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  IOT_THRESHOLDS,
  SIMULATION_RANGES,
} from '../common/constants/business-rules.constants';
import { RealtimeEventsService } from '../common/realtime/realtime-events.service';
import { NotificationPriority, NotificationType } from '@prisma/client';
import {
  createPaginatedResponse,
  getPagination,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';

interface SensorReading {
  fieldId: string;
  soilMoisture: number;
  soilPH: number;
  soilTemperature: number;
}

interface AnomalyIssue {
  code: string;
  message: string;
}

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realtimeEvents: RealtimeEventsService,
  ) {}

  async createSensorReading(data: SensorReading) {
    const field = await this.prisma.field.findUnique({
      where: { id: data.fieldId },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${data.fieldId} not found`);
    }

    const reading = await this.prisma.sensorReading.create({
      data: {
        fieldId: data.fieldId,
        soilMoisture: data.soilMoisture,
        soilPH: data.soilPH,
        soilTemperature: data.soilTemperature,
      },
    });

    await this.checkAnomalies(reading, field.name);
    this.realtimeEvents.emitSensorUpdate({
      fieldId: data.fieldId,
      reading,
      timestamp: new Date(),
    });

    return reading;
  }

  async getLatestReadings(fieldId: string, limit: number = 20) {
    return this.prisma.sensorReading.findMany({
      where: { fieldId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getSensorHistory(fieldId: string, hours: number = 24, query?: PaginationQueryDto) {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where = {
      fieldId,
      timestamp: {
        gte: since,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.sensorReading.findMany({
        where,
        orderBy: { timestamp: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.sensorReading.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async getSensorStats(fieldId: string, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const readings = await this.prisma.sensorReading.findMany({
      where: {
        fieldId,
        timestamp: {
          gte: since,
        },
      },
      select: {
        soilMoisture: true,
        soilPH: true,
        soilTemperature: true,
      },
    });

    if (readings.length === 0) {
      return {
        avgSoilMoisture: 0,
        avgSoilPH: 0,
        avgSoilTemperature: 0,
        dataPoints: 0,
      };
    }

    return {
      avgSoilMoisture: Number(
        (readings.reduce((sum, r) => sum + r.soilMoisture, 0) / readings.length).toFixed(2),
      ),
      avgSoilPH: Number(
        (readings.reduce((sum, r) => sum + r.soilPH, 0) / readings.length).toFixed(2),
      ),
      avgSoilTemperature: Number(
        (readings.reduce((sum, r) => sum + r.soilTemperature, 0) / readings.length).toFixed(2),
      ),
      minSoilMoisture: Math.min(...readings.map((r) => r.soilMoisture)),
      maxSoilMoisture: Math.max(...readings.map((r) => r.soilMoisture)),
      dataPoints: readings.length,
    };
  }

  async simulateSensorData(fieldId: string) {
    const baseReading = {
      soilMoisture:
        SIMULATION_RANGES.MOISTURE.BASE +
        Math.random() * SIMULATION_RANGES.MOISTURE.VARIANCE,
      soilPH:
        SIMULATION_RANGES.PH.BASE + Math.random() * SIMULATION_RANGES.PH.VARIANCE,
      soilTemperature:
        SIMULATION_RANGES.TEMPERATURE.BASE +
        Math.random() * SIMULATION_RANGES.TEMPERATURE.VARIANCE,
    };

    return this.createSensorReading({
      fieldId,
      ...baseReading,
    });
  }

  private validateSensorReading(reading: {
    soilMoisture: number;
    soilPH: number;
    soilTemperature: number;
  }): AnomalyIssue[] {
    const issues: AnomalyIssue[] = [];

    if (reading.soilMoisture < IOT_THRESHOLDS.MOISTURE.MIN) {
      issues.push({
        code: 'low_moisture',
        message: `Low soil moisture detected: ${reading.soilMoisture.toFixed(1)}%`,
      });
    } else if (reading.soilMoisture > IOT_THRESHOLDS.MOISTURE.MAX) {
      issues.push({
        code: 'high_moisture',
        message: `High soil moisture detected: ${reading.soilMoisture.toFixed(1)}%`,
      });
    }

    if (reading.soilPH < IOT_THRESHOLDS.PH.MIN) {
      issues.push({
        code: 'acidic_soil',
        message: `Acidic soil pH detected: ${reading.soilPH.toFixed(2)}`,
      });
    } else if (reading.soilPH > IOT_THRESHOLDS.PH.MAX) {
      issues.push({
        code: 'alkaline_soil',
        message: `Alkaline soil pH detected: ${reading.soilPH.toFixed(2)}`,
      });
    }

    if (reading.soilTemperature < IOT_THRESHOLDS.TEMPERATURE.MIN) {
      issues.push({
        code: 'low_temperature',
        message: `Low soil temperature: ${reading.soilTemperature.toFixed(1)}°C`,
      });
    } else if (reading.soilTemperature > IOT_THRESHOLDS.TEMPERATURE.MAX) {
      issues.push({
        code: 'high_temperature',
        message: `High soil temperature: ${reading.soilTemperature.toFixed(1)}°C`,
      });
    }

    return issues;
  }

  private async checkAnomalies(reading: any, fieldName: string) {
    const issues = this.validateSensorReading(reading);
    const anomalyMessages = issues.map((i) => i.message);

    if (anomalyMessages.length > 0) {
      this.logger.warn(
        `Anomalies detected for field ${fieldName}: ${anomalyMessages.join(', ')}`,
      );

      await this.notificationsService.create({
        type: NotificationType.IOT_ANOMALY,
        priority:
          anomalyMessages.length > 2 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        title: `Sensor Anomaly - ${fieldName}`,
        message: `The following anomalies were detected:\n${anomalyMessages.join('\n')}`,
        metadata: {
          fieldId: reading.fieldId,
          fieldName,
          reading: {
            soilMoisture: reading.soilMoisture,
            soilPH: reading.soilPH,
            soilTemperature: reading.soilTemperature,
          },
        },
      });

      this.realtimeEvents.emitSensorAnomaly({
        fieldId: reading.fieldId,
        anomaly: {
          issues,
          messages: anomalyMessages,
        },
        timestamp: new Date(),
      });
    }
  }

  async getAnomalousReadings(fieldId: string, hours: number = 24, query?: PaginationQueryDto) {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where = {
      fieldId,
      timestamp: {
        gte: since,
      },
      OR: [
        { soilMoisture: { lt: IOT_THRESHOLDS.MOISTURE.MIN } },
        { soilMoisture: { gt: IOT_THRESHOLDS.MOISTURE.MAX } },
        { soilPH: { lt: IOT_THRESHOLDS.PH.MIN } },
        { soilPH: { gt: IOT_THRESHOLDS.PH.MAX } },
        { soilTemperature: { lt: IOT_THRESHOLDS.TEMPERATURE.MIN } },
        { soilTemperature: { gt: IOT_THRESHOLDS.TEMPERATURE.MAX } },
      ],
    };

    const [readings, total] = await Promise.all([
      this.prisma.sensorReading.findMany({
        where,
        orderBy: { timestamp: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.sensorReading.count({ where }),
    ]);

    return createPaginatedResponse(
      readings.map((r) => ({
        ...r,
        anomalies: this.identifyAnomalies(r),
      })),
      total,
      page,
      limit,
    );
  }

  private identifyAnomalies(reading: any): string[] {
    const issues = this.validateSensorReading(reading);
    return issues.map((i) => i.code);
  }
}
