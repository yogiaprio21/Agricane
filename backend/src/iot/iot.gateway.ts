import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { IotService } from './iot.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeEventsService } from '../common/realtime/realtime-events.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true,
  },
  namespace: '/iot',
})
export class IotGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IotGateway.name);
  private connectedClients: Map<string, string> = new Map();

  constructor(
    private iotService: IotService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private realtimeEvents: RealtimeEventsService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const token = client.handshake.auth?.token;

        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication token is required'));
        }

        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('jwt.secret'),
        });

        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid socket user'));
        }

        client.data.user = user;
        return next();
      } catch (error) {
        return next(new Error('Invalid authentication token'));
      }
    });

    this.realtimeEvents.onSensorUpdate(({ fieldId, reading, timestamp }) => {
      server.to(`field:${fieldId}`).emit('sensor_update', {
        fieldId,
        reading,
        timestamp,
      });
    });

    this.realtimeEvents.onSensorAnomaly(({ fieldId, anomaly, timestamp }) => {
      server.to(`field:${fieldId}`).emit('sensor_anomaly', {
        fieldId,
        anomaly,
        timestamp,
      });
    });

    this.realtimeEvents.onNotification(({ notification, userId }) => {
      if (userId) {
        server.to(`user:${userId}`).emit('new_notification', notification);
        return;
      }

      server.emit('new_notification', notification);
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.id;
    this.logger.log(`Client connected: ${client.id}${userId ? ` user=${userId}` : ''}`);
    this.connectedClients.set(client.id, userId || 'connected');

    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe_field')
  handleSubscribeField(
    @MessageBody() data: { fieldId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`field:${data.fieldId}`);
    this.logger.log(`Client ${client.id} subscribed to field ${data.fieldId}`);
    return { event: 'subscribed', data: { fieldId: data.fieldId } };
  }

  @SubscribeMessage('unsubscribe_field')
  handleUnsubscribeField(
    @MessageBody() data: { fieldId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`field:${data.fieldId}`);
    this.logger.log(`Client ${client.id} unsubscribed from field ${data.fieldId}`);
    return { event: 'unsubscribed', data: { fieldId: data.fieldId } };
  }

  @SubscribeMessage('sensor_data')
  async handleSensorData(
    @MessageBody() data: { fieldId: string; soilMoisture: number; soilPH: number; soilTemperature: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const allowedRoles = ['ADMIN', 'TECHNICIAN', 'AGRONOMIST', 'MANAGER'];
      if (!allowedRoles.includes(client.data.user?.role)) {
        return { event: 'error', data: { message: 'Insufficient role for sensor data writes' } };
      }

      const reading = await this.iotService.createSensorReading(data);
      return { event: 'sensor_data_saved', data: reading };
    } catch (error) {
      this.logger.error(`Failed to save sensor data: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('request_latest')
  async handleRequestLatest(
    @MessageBody() data: { fieldId: string; limit?: number },
    @ConnectedSocket() _client: Socket,
  ) {
    try {
      const readings = await this.iotService.getLatestReadings(data.fieldId, data.limit || 20);
      return { event: 'latest_readings', data: readings };
    } catch (error) {
      this.logger.error(`Failed to fetch latest readings: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  broadcastSensorUpdate(fieldId: string, reading: any) {
    this.realtimeEvents.emitSensorUpdate({
      fieldId,
      reading,
      timestamp: new Date(),
    });
  }

  broadcastAnomaly(fieldId: string, anomaly: any) {
    this.realtimeEvents.emitSensorAnomaly({
      fieldId,
      anomaly,
      timestamp: new Date(),
    });
  }
}
