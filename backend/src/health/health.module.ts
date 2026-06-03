import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { IntegrationStatusService } from './integration-status.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [IntegrationStatusService],
})
export class HealthModule {}
