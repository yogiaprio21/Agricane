import { NotificationPriority, NotificationType, PrismaClient } from '@prisma/client';
import { SeededUsers } from './auth.seed';
import { SeededFields } from './fields.seed';

export async function seedNotifications(prisma: PrismaClient, users: SeededUsers, fields: SeededFields) {
  const admin = users['admin@agricane.com'];
  const manager = users['manager@agricane.com'];

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: NotificationType.SYSTEM_INFO,
        priority: NotificationPriority.LOW,
        title: 'Demo dataset ready',
        message: 'Seeded portfolio dataset includes fields, sensor history, NDVI, weather, AI decisions, and drone logs.',
        isRead: false,
      },
      {
        userId: manager.id,
        type: NotificationType.HEALTH_DEGRADATION,
        priority: NotificationPriority.HIGH,
        title: `${fields[4].name} requires inspection`,
        message: 'NDVI and soil moisture indicate moderate stress risk near the irrigation channel.',
        metadata: { fieldId: fields[4].id },
        isRead: false,
      },
      {
        userId: admin.id,
        type: NotificationType.HARVEST_READY,
        priority: NotificationPriority.MEDIUM,
        title: `${fields[2].name} harvest window`,
        message: 'Harvest readiness model recommends planning labor and logistics this week.',
        metadata: { fieldId: fields[2].id },
        isRead: true,
      },
    ],
  });
}
