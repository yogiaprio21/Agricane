import { PrismaClient } from '@prisma/client';
import { SeededFields } from './fields.seed';
import { daysAgo } from './time';

export async function seedWeatherData(prisma: PrismaClient, fields: SeededFields) {
  const rows = fields.flatMap((field, fieldIndex) =>
    Array.from({ length: 30 }, (_, day) => {
      const variation = Math.sin((day + fieldIndex) / 3);
      return {
        fieldId: field.id,
        temperature: 27 + fieldIndex * 0.7 + variation * 3,
        humidity: 68 + fieldIndex * 2 + Math.cos(day / 4) * 8,
        rainfall: day % 6 === 0 ? 3.8 + fieldIndex : day % 11 === 0 ? 1.2 : 0,
        windSpeed: 5 + Math.abs(variation) * 2,
        pressure: 1008 + Math.cos(day / 5) * 4,
        weatherDesc: day % 6 === 0 ? 'Light Rain' : day % 3 === 0 ? 'Scattered Clouds' : 'Broken Clouds',
        recordedAt: daysAgo(day, 9),
        source: 'OpenWeatherMap',
      };
    }),
  );

  await prisma.weatherData.createMany({ data: rows });
}
