import { PrismaClient } from '@prisma/client';
import { SeededUsers } from './auth.seed';
import { SeededFields } from './fields.seed';
import { daysAgo } from './time';

export async function seedDroneFlights(prisma: PrismaClient, fields: SeededFields, users: SeededUsers) {
  const operator = users['drone@agricane.com'];

  await prisma.droneFlight.createMany({
    data: [
      {
        fieldId: fields[0].id,
        operatorId: operator.id,
        flightDate: daysAgo(2, 7),
        duration: 42,
        altitudeMeters: 120,
        imageCount: 315,
        notes: 'Complete field coverage. Vegetation appears uniform with minor weed pressure near east boundary.',
      },
      {
        fieldId: fields[1].id,
        operatorId: operator.id,
        flightDate: daysAgo(6, 8),
        duration: 38,
        altitudeMeters: 110,
        imageCount: 288,
        notes: 'Cloudy morning but imagery usable. Recheck drainage line after rainfall.',
      },
      {
        fieldId: fields[2].id,
        operatorId: operator.id,
        flightDate: daysAgo(9, 9),
        duration: 50,
        altitudeMeters: 130,
        imageCount: 402,
        notes: 'Harvest readiness inspection. Lodging risk noted on southern edge.',
      },
      {
        fieldId: fields[4].id,
        operatorId: operator.id,
        flightDate: daysAgo(13, 8),
        duration: 46,
        altitudeMeters: 125,
        imageCount: 367,
        notes: 'Low NDVI pocket visible close to irrigation channel.',
      },
    ],
  });
}
