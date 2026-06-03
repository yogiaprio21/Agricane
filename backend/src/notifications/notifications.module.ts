import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeEventsModule } from '../common/realtime/realtime-events.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    RealtimeEventsModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('notification.smtp.host'),
          port: config.get<number>('notification.smtp.port') || 587,
          secure: config.get<boolean>('notification.smtp.secure') || false,
          auth: {
            user: config.get<string>('notification.smtp.user'),
            pass: config.get<string>('notification.smtp.password'),
          },
        },
        defaults: {
          from: config.get<string>('notification.from'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
