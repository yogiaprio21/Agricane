import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgronomyService } from './agronomy.service';
import { AgronomyController } from './agronomy.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AgronomyController],
  providers: [AgronomyService],
  exports: [AgronomyService],
})
export class AgronomyModule {}