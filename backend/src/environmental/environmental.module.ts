import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { EnvironmentalService } from './environmental.service';
import { EnvironmentalController } from './environmental.controller';
import { EnvironmentalCron } from './environmental.cron';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600000, // 10 minutes (in milliseconds for v5/v6? No, cache-manager v5 uses milliseconds, but nestjs wrapper might differ. Usually seconds in v4, milliseconds in v5)
      // NestJS v10 + cache-manager v5: ttl is in milliseconds.
    }),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [EnvironmentalController],
  providers: [EnvironmentalService, EnvironmentalCron],
  exports: [EnvironmentalService],
})
export class EnvironmentalModule {}