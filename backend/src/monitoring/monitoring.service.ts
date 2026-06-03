import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { HealthStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import {
  createPaginatedResponse,
  getPagination,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly copernicusClientId: string;
  private readonly copernicusClientSecret: string;
  private readonly copernicusBaseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.copernicusClientId = this.configService.get<string>('copernicus.clientId');
    this.copernicusClientSecret = this.configService.get<string>('copernicus.clientSecret');
    this.copernicusBaseUrl = this.configService.get<string>('copernicus.baseUrl') || 'https://services.sentinel-hub.com';
    
    this.axiosInstance = axios.create({
      baseURL: this.copernicusBaseUrl,
      timeout: 10000,
    });
  }

  private async getAccessToken(): Promise<string | null> {
    const cacheKey = 'sentinel_hub_token';
    const cachedToken = await this.cacheManager.get<string>(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }

    if (!this.copernicusClientId || !this.copernicusClientSecret) {
      this.logger.warn('Copernicus Client ID or Secret is missing.');
      return null;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.copernicusClientId);
      params.append('client_secret', this.copernicusClientSecret);

      const response = await this.axiosInstance.post('/oauth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const token = response.data.access_token;
      const expiresIn = response.data.expires_in; // usually 3600 seconds

      // Cache for slightly less than expiration time
      await this.cacheManager.set(cacheKey, token, (expiresIn - 60) * 1000);
      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to authenticate with Sentinel Hub: ${message}`);
      return null;
    }
  }

  async fetchNDVIForField(fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    let ndviValue: number;
    let source = 'Copernicus Sentinel-2';
    let cloudCover = 0;
    let sourceType: 'LIVE' | 'SIMULATED' = 'SIMULATED';
    let apiStatus = 'missing_credentials';

    const token = await this.getAccessToken();

    if (token) {
      apiStatus = 'no_valid_data';
      try {
        // Real API Call Implementation
        // Using Statistical API for accurate mean NDVI
        // Note: In a real scenario, we would need the field's polygon (geometry). 
        // Here we simulate a small bbox around the point.
        const delta = 0.005; // approx 500m
        const bbox = [
          field.longitude - delta,
          field.latitude - delta,
          field.longitude + delta,
          field.latitude + delta
        ];

        const now = new Date();
        const past = new Date();
        past.setDate(now.getDate() - 10); // Look back 10 days

        const payload = {
          input: {
            bounds: {
              bbox: bbox,
              properties: {
                crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
              }
            },
            data: [{
              type: "sentinel-2-l2a",
              dataFilter: {
                maxCloudCoverage: 30
              }
            }]
          },
          aggregation: {
            timeRange: {
              from: past.toISOString(),
              to: now.toISOString()
            },
            aggregationInterval: {
              of: "P1D"
            },
            evalscript: `
              //VERSION=3
              function setup() {
                return {
                  input: ["B04", "B08", "SCL"],
                  output: { bands: 1 }
                };
              }
              function evaluatePixel(sample) {
                // SCL 4, 5, 6 are vegetation/bare soil. 3 is cloud shadow, 8-10 clouds.
                // Simple NDVI
                let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                return [ndvi];
              }
            `
          }
        };

        const response = await this.axiosInstance.post('/api/v1/statistics', payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        // Parse response to find the latest valid interval
        const data = response.data.data;
        if (data && data.length > 0) {
          // Find latest with valid data
          const latest = data.reverse().find(d => d.outputs && d.outputs.default && d.outputs.default.bands.B0.stats.mean !== undefined);
          if (latest) {
             ndviValue = latest.outputs.default.bands.B0.stats.mean;
             // Clamp NDVI between -1 and 1
             ndviValue = Math.max(-1, Math.min(1, ndviValue));
             cloudCover = 0; // Statistical API might not return cloud cover directly unless requested
             sourceType = 'LIVE';
             apiStatus = 'ok';
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Sentinel Hub API failed: ${message}. Falling back to simulation.`);
        apiStatus = 'request_failed';
        // Fallback handled below
      }
    }

    // Fallback if no token or API failed or no data found
    if (ndviValue === undefined) {
      ndviValue = 0.3 + Math.random() * 0.6;
      cloudCover = Math.random() * 30;
      source += ' (Simulated)';
    }

    const healthStatus = this.classifyHealthStatus(ndviValue);

    const ndviData = await this.prisma.nDVIData.create({
      data: {
        fieldId: field.id,
        ndviValue: Number(ndviValue.toFixed(3)),
        healthStatus,
        captureDate: new Date(),
        source: source,
        satellitePass: `S2A_${new Date().toISOString().split('T')[0]}`,
        cloudCover: cloudCover,
        metadata: {
          sourceType,
          apiStatus,
          provider: 'Sentinel Hub Statistical API',
          fetchedAt: new Date().toISOString(),
          coordinates: {
            latitude: field.latitude,
            longitude: field.longitude,
          },
          processingLevel: 'L2A',
        },
      },
    });

    this.logger.log(`NDVI data fetched for field ${field.name}: ${ndviValue.toFixed(3)} (${healthStatus})`);

    return {
      ...ndviData,
      sourceType,
      apiStatus,
      provider: 'Sentinel Hub Statistical API',
    };
  }

  private classifyHealthStatus(ndviValue: number): HealthStatus {
    if (ndviValue >= 0.6) {
      return HealthStatus.HEALTHY;
    } else if (ndviValue >= 0.4) {
      return HealthStatus.MODERATE_STRESS;
    } else if (ndviValue >= 0.2) {
      return HealthStatus.SEVERE_STRESS;
    } else {
      return HealthStatus.UNKNOWN;
    }
  }

  async getNDVIHistory(fieldId: string, days: number = 30, query?: PaginationQueryDto) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where = {
      fieldId,
      captureDate: {
        gte: since,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.nDVIData.findMany({
        where,
        orderBy: {
          captureDate: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.nDVIData.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async getFieldHealthTrend(fieldId: string) {
    const historyResponse = await this.getNDVIHistory(fieldId, 90, { limit: 100, sortOrder: 'desc' });
    const history = historyResponse.data;

    if (history.length === 0) {
      return {
        trend: 'no_data',
        avgNDVI: 0,
        latestHealth: 'UNKNOWN',
        dataPoints: 0,
      };
    }

    const avgNDVI = history.reduce((sum, d) => sum + d.ndviValue, 0) / history.length;
    const latestHealth = history[0].healthStatus;

    let trend = 'stable';
    if (history.length >= 2) {
      const recentAvg = history.slice(0, 3).reduce((sum, d) => sum + d.ndviValue, 0) / Math.min(3, history.length);
      const olderAvg = history.slice(-3).reduce((sum, d) => sum + d.ndviValue, 0) / Math.min(3, history.length);

      if (recentAvg > olderAvg + 0.1) {
        trend = 'improving';
      } else if (recentAvg < olderAvg - 0.1) {
        trend = 'declining';
      }
    }

    return {
      trend,
      avgNDVI: Number(avgNDVI.toFixed(3)),
      latestHealth,
      latestNDVI: history[0].ndviValue,
      dataPoints: history.length,
      history: history.slice(0, 10),
    };
  }

  async createDroneFlight(data: {
    fieldId: string;
    operatorId: string;
    flightDate: Date;
    duration: number;
    altitudeMeters: number;
    notes?: string;
    imageCount?: number;
  }) {
    const field = await this.prisma.field.findUnique({
      where: { id: data.fieldId },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${data.fieldId} not found`);
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: data.operatorId },
    });

    if (!operator) {
      throw new NotFoundException(`Operator with ID ${data.operatorId} not found`);
    }

    return this.prisma.droneFlight.create({
      data: {
        fieldId: data.fieldId,
        operatorId: data.operatorId,
        flightDate: data.flightDate,
        duration: data.duration,
        altitudeMeters: data.altitudeMeters,
        notes: data.notes,
        imageCount: data.imageCount || 0,
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getDroneFlights(fieldId: string, query?: PaginationQueryDto) {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const where = { fieldId };
    const [data, total] = await Promise.all([
      this.prisma.droneFlight.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          flightDate: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.droneFlight.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async getDroneFlightById(id: string) {
    const flight = await this.prisma.droneFlight.findUnique({
      where: { id },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException(`Drone flight with ID ${id} not found`);
    }

    return flight;
  }

  async updateDroneFlight(id: string, data: Partial<{
    flightDate: Date;
    duration: number;
    altitudeMeters: number;
    notes: string;
    imageCount: number;
  }>) {
    await this.getDroneFlightById(id);

    const updateData = {
      ...(data.flightDate !== undefined ? { flightDate: data.flightDate } : {}),
      ...(data.duration !== undefined ? { duration: data.duration } : {}),
      ...(data.altitudeMeters !== undefined ? { altitudeMeters: data.altitudeMeters } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.imageCount !== undefined ? { imageCount: data.imageCount } : {}),
    };

    return this.prisma.droneFlight.update({
      where: { id },
      data: updateData,
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteDroneFlight(id: string) {
    await this.getDroneFlightById(id);

    await this.prisma.droneFlight.delete({
      where: { id },
    });

    return { message: 'Drone flight deleted successfully' };
  }

  async getFieldHealthSummary() {
    const fields = await this.prisma.field.findMany({
      include: {
        ndviData: {
          take: 1,
          orderBy: {
            captureDate: 'desc',
          },
        },
      },
    });

    return fields.map((field) => ({
      fieldId: field.id,
      fieldName: field.name,
      latestNDVI: field.ndviData[0]?.ndviValue || null,
      healthStatus: field.ndviData[0]?.healthStatus || 'UNKNOWN',
      lastUpdated: field.ndviData[0]?.captureDate || null,
    }));
  }
}
