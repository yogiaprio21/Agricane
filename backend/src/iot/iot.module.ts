import { Module } from '@nestjs/common';
import { IotService } from './iot.service';
import { IotController } from './iot.controller';
import { IotGateway } from './iot.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeEventsModule } from '../common/realtime/realtime-events.module';

@Module({
  imports: [PrismaModule, NotificationsModule, JwtModule.register({}), RealtimeEventsModule],
  controllers: [IotController],
  providers: [IotService, IotGateway],
  exports: [IotService, IotGateway],
})
export class IotModule {}
