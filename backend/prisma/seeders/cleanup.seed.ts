import { PrismaClient } from '@prisma/client';

export async function clearDemoData(prisma: PrismaClient) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to reset production data. Set ALLOW_DEMO_SEED=true only when intentionally seeding demo data.');
  }

  await prisma.notification.deleteMany();
  await prisma.aIDecision.deleteMany();
  await prisma.droneFlight.deleteMany();
  await prisma.nDVIData.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.weatherData.deleteMany();
  await prisma.field.deleteMany();
  await prisma.fAOReference.deleteMany();
  await prisma.systemCache.deleteMany();
}
