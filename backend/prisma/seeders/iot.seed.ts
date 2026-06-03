import { PrismaClient } from '@prisma/client';
import { SeededFields } from './fields.seed';
import { hoursAgo } from './time';

export async function seedSensorReadings(prisma: PrismaClient, fields: SeededFields) {
  const rows = fields.flatMap((field, fieldIndex) =>
    Array.from({ length: 72 }, (_, index) => {
      const wave = Math.sin(index / 5 + fieldIndex);
      const dryFieldAdjustment = fieldIndex === 2 ? -8 : fieldIndex === 4 ? -13 : 0;

      return {
        fieldId: field.id,
        soilMoisture: Math.max(24, Math.min(78, 55 + dryFieldAdjustment + wave * 11)),
        soilPH: Math.max(5.4, Math.min(7.8, 6.7 + Math.cos(index / 8 + fieldIndex) * 0.45)),
        soilTemperature: 25 + fieldIndex * 0.5 + Math.sin(index / 6) * 2.3,
        timestamp: hoursAgo(index),
      };
    }),
  );

  await prisma.sensorReading.createMany({ data: rows });
}
