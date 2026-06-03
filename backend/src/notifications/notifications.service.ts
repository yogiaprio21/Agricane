import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPriority, NotificationType, Prisma } from '@prisma/client';
import { RealtimeEventsService } from '../common/realtime/realtime-events.service';
import {
  createPaginatedResponse,
  getPagination,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';

interface CreateNotificationDto {
  userId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
    private realtimeEvents: RealtimeEventsService,
  ) {}

  async create(data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId || null,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      },
    });

    this.logger.log(`Notification created: ${notification.title} [${notification.priority}]`);
    this.realtimeEvents.emitNotification({
      notification,
      userId: notification.userId,
    });

    // Send Email for High Priority Notifications
    if (data.priority === 'HIGH' || data.priority === 'CRITICAL') {
      // Don't await email sending to prevent blocking response
      this.sendEmailNotification(data).catch(err => 
        this.logger.error(`Failed to send email notification: ${err.message}`)
      );
    }

    return notification;
  }

  private async sendEmailNotification(data: CreateNotificationDto) {
    let recipients: string[] = [];

    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (user?.email) {
        recipients.push(user.email);
      }
    } else {
      // If no user specified (Broadcast), send to ADMINs or relevant roles based on type?
      // For now, keep it simple: No user = No email, unless we implement broadcast logic.
      // Or maybe fetch all admins for CRITICAL system alerts.
      if (data.priority === 'CRITICAL') {
        const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
        recipients = admins.map(u => u.email);
      }
    }

    if (recipients.length > 0) {
      const safeTitle = this.escapeHtml(data.title);
      const safeMessage = this.escapeHtml(data.message);

      for (const recipient of recipients) {
        await this.mailerService.sendMail({
          to: recipient,
          subject: `[Agricane ${data.priority}] ${data.title}`,
          text: `${data.message}\n\nType: ${data.type}\nPriority: ${data.priority}`,
          html: `
            <h3>${safeTitle}</h3>
            <p>${safeMessage}</p>
            <hr>
            <p><strong>Type:</strong> ${data.type}</p>
            <p><strong>Priority:</strong> ${data.priority}</p>
            <p><em>Agricane Intelligence Platform</em></p>
          `,
        });
        this.logger.log(`Email sent to ${recipient}`);
      }
    }
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async findAll(
    userId?: string,
    query?: PaginationQueryDto & {
      unreadOnly?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
    },
  ) {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const where: Prisma.NotificationWhereInput = {};

    if (userId) {
      where.OR = query?.unreadOnly ? [{ userId }] : [{ userId }, { userId: null }];
    }

    if (query?.unreadOnly) {
      where.isRead = false;
    }

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.priority) {
      where.priority = query.priority;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return createPaginatedResponse(
      notifications.map((notification) =>
        notification.userId === null ? { ...notification, isRead: true } : notification,
      ),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (userId && notification.userId !== null && notification.userId !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    return notification.userId === null ? { ...notification, isRead: true } : notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    if (notification.userId === null) {
      throw new BadRequestException('Broadcast notifications cannot be marked as read per user');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { updated: result.count };
  }

  async delete(id: string, userId?: string) {
    const notification = await this.findOne(id, userId);

    if (userId && notification.userId === null) {
      throw new BadRequestException('Broadcast notifications cannot be deleted by individual users');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }

  async getUnreadCount(userId?: string) {
    const where: any = { isRead: false };

    if (userId) {
      where.userId = userId;
    }

    const count = await this.prisma.notification.count({
      where,
    });

    return { unreadCount: count };
  }

  async getNotificationsByType(type: NotificationType, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: {
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getNotificationsByPriority(priority: NotificationPriority, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: {
        priority,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async createWeatherAlert(fieldId: string, fieldName: string, alertType: string, details: string) {
    return this.create({
      type: NotificationType.WEATHER_ALERT,
      priority:
        alertType === 'extreme' ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
      title: `Weather Alert - ${fieldName}`,
      message: details,
      metadata: {
        fieldId,
        fieldName,
        alertType,
      },
    });
  }

  async createHarvestAlert(fieldId: string, fieldName: string, cropAge: number) {
    return this.create({
      type: NotificationType.HARVEST_READY,
      priority: NotificationPriority.HIGH,
      title: `Harvest Ready - ${fieldName}`,
      message: `Field ${fieldName} has reached optimal harvest maturity at ${cropAge} days. Recommend scheduling harvest within 2-4 weeks.`,
      metadata: {
        fieldId,
        fieldName,
        cropAge,
      },
    });
  }

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    this.logger.log(`Deleted ${result.count} old notifications`);
    return { deleted: result.count };
  }
}
