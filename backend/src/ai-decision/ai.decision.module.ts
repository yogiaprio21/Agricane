import { Module } from '@nestjs/common';
import { AiDecisionService } from './ai.decision.service';
import { AiDecisionController } from './ai.decision.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AgronomyModule } from '../agronomy/agronomy.module';
import { IotModule } from '../iot/iot.module';
import { EnvironmentalModule } from '../environmental/environmental.module';

@Module({
  imports: [
    PrismaModule,
    AgronomyModule,
    IotModule,
    EnvironmentalModule,
  ],
  controllers: [AiDecisionController],
  providers: [AiDecisionService],
  exports: [AiDecisionService],
})
export class AiDecisionModule {}