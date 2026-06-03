import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/current-user.decorators';
import { IntegrationStatusService } from './integration-status.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly integrationStatusService: IntegrationStatusService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lightweight application health check' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'agricane-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  @Public()
  @Get('integrations')
  @ApiOperation({ summary: 'Integration configuration and lightweight database status' })
  @ApiResponse({ status: 200, description: 'Integration status retrieved' })
  getIntegrations() {
    return this.integrationStatusService.getStatus();
  }
}
