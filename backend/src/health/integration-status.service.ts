import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type IntegrationState = 'healthy' | 'configured' | 'missing' | 'disabled' | 'error';

export interface IntegrationStatus {
  name: string;
  state: IntegrationState;
  provider?: string;
  details?: string;
  checkedAt: string;
}

export interface IntegrationStatusResponse {
  status: 'ok' | 'degraded';
  checkedAt: string;
  integrations: IntegrationStatus[];
}

@Injectable()
export class IntegrationStatusService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getStatus(): Promise<IntegrationStatusResponse> {
    const checkedAt = new Date().toISOString();
    const database = await this.getDatabaseStatus(checkedAt);
    const integrations = [
      database,
      this.fromRequiredEnv('openweather', 'OpenWeatherMap', 'OPENWEATHER_API_KEY', checkedAt),
      this.fromRequiredEnv('sentinel-hub', 'Sentinel Hub', 'COPERNICUS_CLIENT_ID', checkedAt, [
        'COPERNICUS_CLIENT_SECRET',
      ]),
      this.getFaoStatus(checkedAt),
      this.getSmtpStatus(checkedAt),
      this.getCorsStatus(checkedAt),
    ];
    const hasBlockingIssue = integrations.some((integration) =>
      ['error', 'missing'].includes(integration.state),
    );

    return {
      status: hasBlockingIssue ? 'degraded' : 'ok',
      checkedAt,
      integrations,
    };
  }

  private async getDatabaseStatus(checkedAt: string): Promise<IntegrationStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        name: 'database',
        provider: 'PostgreSQL',
        state: 'healthy',
        checkedAt,
      };
    } catch (error) {
      return {
        name: 'database',
        provider: 'PostgreSQL',
        state: 'error',
        details: error instanceof Error ? error.message : 'Database connection failed',
        checkedAt,
      };
    }
  }

  private fromRequiredEnv(
    name: string,
    provider: string,
    primaryKey: string,
    checkedAt: string,
    additionalKeys: string[] = [],
  ): IntegrationStatus {
    const missing = [primaryKey, ...additionalKeys].filter(
      (key) => !process.env[key] || process.env[key]?.trim() === '',
    );

    return {
      name,
      provider,
      state: missing.length === 0 ? 'configured' : 'missing',
      details:
        missing.length === 0
          ? 'Credentials are configured; live provider calls are checked during feature requests.'
          : `Missing ${missing.join(', ')}`,
      checkedAt,
    };
  }

  private getFaoStatus(checkedAt: string): IntegrationStatus {
    const baseUrl = this.configService.get<string>('fao.baseUrl');

    return {
      name: 'fao-reference',
      provider: 'FAOSTAT/local agronomy fallback',
      state: baseUrl ? 'configured' : 'missing',
      details:
        'Current agronomy module can fall back to local sugarcane rules when FAO data is unavailable.',
      checkedAt,
    };
  }

  private getSmtpStatus(checkedAt: string): IntegrationStatus {
    const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
    const missing = keys.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

    return {
      name: 'smtp',
      provider: 'SMTP',
      state: missing.length === 0 ? 'configured' : 'disabled',
      details:
        missing.length === 0
          ? 'Email notification credentials are configured.'
          : `Email delivery disabled; missing ${missing.join(', ')}`,
      checkedAt,
    };
  }

  private getCorsStatus(checkedAt: string): IntegrationStatus {
    const origins = this.configService.get<string[]>('cors.origin') || [];

    return {
      name: 'cors',
      state: origins.length > 0 ? 'configured' : 'missing',
      details: origins.join(', '),
      checkedAt,
    };
  }
}
