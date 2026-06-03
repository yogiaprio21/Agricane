import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvironmentalService } from './environmental.service';

@Injectable()
export class EnvironmentalCron {
  private readonly logger = new Logger(EnvironmentalCron.name);

  constructor(private environmentalService: EnvironmentalService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async updateWeatherData() {
    this.logger.log('Starting scheduled weather update for all fields...');

    try {
      const results = await this.environmentalService.fetchWeatherForAllFields();
      
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.logger.log(
        `Weather update completed: ${successful} succeeded, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error('Scheduled weather update failed', error);
    }
  }
}