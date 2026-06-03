import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  createPaginatedResponse,
  getPagination,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class EnvironmentalService {
  private readonly logger = new Logger(EnvironmentalService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get<string>('openWeather.apiKey');
    this.baseUrl = this.configService.get<string>('openWeather.baseUrl') || 'https://api.openweathermap.org/data/2.5';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
    });

    if (!this.apiKey) {
      this.logger.warn('OpenWeatherMap API Key is missing. Weather fetching will fail.');
    }
  }

  async fetchWeatherForField(fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    if (!field) {
      throw new HttpException('Field not found', HttpStatus.NOT_FOUND);
    }

    const cacheKey = `weather:${field.latitude},${field.longitude}`;
    const cached = await this.cacheManager.get<any>(cacheKey);

    if (cached) {
      this.logger.log(`Using cached weather data for field ${field.name}`);
      return this.withSourceMetadata(cached, 'CACHE');
    }

    try {
      const response = await this.axiosInstance.get('/weather', {
        params: {
          lat: field.latitude,
          lon: field.longitude,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      const weatherData = {
        fieldId: field.id,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        rainfall: response.data.rain?.['1h'] || 0,
        windSpeed: response.data.wind.speed,
        pressure: response.data.main.pressure,
        weatherDesc: response.data.weather[0]?.description || 'clear',
        source: 'OpenWeatherMap',
      };

      const saved = await this.prisma.weatherData.create({
        data: weatherData,
      });

      // Cache for 10 minutes (600000 ms)
      await this.cacheManager.set(cacheKey, saved, 600000);
      this.logger.log(`Weather data fetched for field ${field.name}`);

      return this.withSourceMetadata(saved, 'LIVE');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `OpenWeatherMap API error for field ${field.name}: ${axiosError.message}`,
        );

        const latest = await this.prisma.weatherData.findFirst({
          where: { fieldId },
          orderBy: { recordedAt: 'desc' },
        });

        if (latest) {
          this.logger.warn(`Using latest local weather fallback for field ${field.name}`);
          return this.withSourceMetadata(latest, 'FALLBACK', 'Local weather history');
        }
      }

      throw new HttpException(
        'Failed to fetch weather data from OpenWeatherMap',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async fetchWeatherForAllFields() {
    const fields = await this.prisma.field.findMany({
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    const results = [];

    for (const field of fields) {
      try {
        const weather = await this.fetchWeatherForField(field.id);
        results.push({ fieldId: field.id, success: true, data: weather });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to fetch weather for field ${field.name}`);
        results.push({ fieldId: field.id, success: false, error: message });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  async getWeatherHistory(fieldId: string, days: number = 7, query?: PaginationQueryDto) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where = {
      fieldId,
      recordedAt: {
        gte: since,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.weatherData.findMany({
        where,
        orderBy: {
          recordedAt: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.weatherData.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async getWeatherHistoryLegacy(fieldId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.weatherData.findMany({
      where: {
        fieldId,
        recordedAt: {
          gte: since,
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });
  }

  async getWeatherStats(fieldId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await this.prisma.weatherData.findMany({
      where: {
        fieldId,
        recordedAt: {
          gte: since,
        },
      },
      select: {
        temperature: true,
        humidity: true,
        rainfall: true,
      },
    });

    if (data.length === 0) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        totalRainfall: 0,
        dataPoints: 0,
      };
    }

    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const avgHumidity = data.reduce((sum, d) => sum + d.humidity, 0) / data.length;
    const totalRain = data.reduce((sum, d) => sum + d.rainfall, 0);

    return {
      avgTemperature: Number(avgTemp.toFixed(2)),
      avgHumidity: Number(avgHumidity.toFixed(2)),
      totalRainfall: Number(totalRain.toFixed(2)),
      dataPoints: data.length,
    };
  }

  async getForecast(fieldId: string, slots: number = 8) {
    const slotCount = Math.min(Math.max(slots || 8, 1), 40);
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      select: { latitude: true, longitude: true, name: true },
    });

    if (!field) {
      throw new HttpException('Field not found', HttpStatus.NOT_FOUND);
    }

    try {
      const response = await this.axiosInstance.get('/forecast', {
        params: {
          lat: field.latitude,
          lon: field.longitude,
          appid: this.apiKey,
          units: 'metric',
          cnt: slotCount,
        },
      });

      return {
        fieldId,
        fieldName: field.name,
        sourceType: 'LIVE',
        provider: 'OpenWeatherMap',
        fetchedAt: new Date().toISOString(),
        forecast: response.data.list.map((item: any) => ({
          datetime: item.dt_txt,
          temperature: item.main.temp,
          humidity: item.main.humidity,
          rainfall: item.rain?.['3h'] || 0,
          weatherDesc: item.weather[0]?.description || 'clear',
        })),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `OpenWeatherMap Forecast API error for field ${field.name} (ID: ${fieldId}): ${axiosError.message} - Status: ${axiosError.response?.status}`,
        );
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to fetch forecast for field ${field.name}: ${message}`);
      }

      const fallback = await this.buildForecastFallback(fieldId, field.name, slotCount);
      if (fallback) {
        this.logger.warn(`Using local weather forecast fallback for field ${field.name}`);
        return fallback;
      }

      throw new HttpException(
        'Failed to fetch forecast data',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async buildForecastFallback(fieldId: string, fieldName: string, slots: number) {
    const latest = await this.prisma.weatherData.findFirst({
      where: { fieldId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    const forecast = Array.from({ length: slots }, (_, index) => {
      const datetime = new Date(Date.now() + (index + 1) * 3 * 60 * 60 * 1000);
      const dailyWave = Math.sin((index / Math.max(slots - 1, 1)) * Math.PI);
      const temperature = latest.temperature + Number((dailyWave * 1.4).toFixed(2));

      return {
        datetime: datetime.toISOString(),
        temperature: Number(temperature.toFixed(2)),
        humidity: latest.humidity,
        rainfall: latest.rainfall,
        weatherDesc: latest.weatherDesc || 'local history estimate',
      };
    });

    return {
      fieldId,
      fieldName,
      sourceType: 'FALLBACK',
      provider: 'Local weather history',
      fetchedAt: new Date().toISOString(),
      forecast,
    };
  }

  private withSourceMetadata<T extends object>(
    data: T,
    sourceType: 'LIVE' | 'CACHE' | 'FALLBACK',
    provider: string = 'OpenWeatherMap',
  ) {
    return {
      ...data,
      sourceType,
      provider,
      fetchedAt: new Date().toISOString(),
    };
  }
}
