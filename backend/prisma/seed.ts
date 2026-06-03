import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeders/auth.seed';
import { clearDemoData } from './seeders/cleanup.seed';
import { seedAIDecisions } from './seeders/ai.seed';
import { seedAgronomyReferences } from './seeders/agronomy.seed';
import { seedDroneFlights } from './seeders/drone.seed';
import { seedFields } from './seeders/fields.seed';
import { seedWeatherData } from './seeders/weather.seed';
import { seedSensorReadings } from './seeders/iot.seed';
import { seedMonitoringData } from './seeders/monitoring.seed';
import { seedNotifications } from './seeders/notifications.seed';
import { assertDatabaseSchemaReady } from './seeders/schema.guard';

const prisma = new PrismaClient();

async function main() {
  const clearOnly = process.argv.includes('--clear-demo');

  console.log(clearOnly ? 'Clearing AgriCane demo data...' : 'Starting AgriCane demo seed...');
  await assertDatabaseSchemaReady(prisma);
  await clearDemoData(prisma);

  if (clearOnly) {
    console.log('Demo data cleared.');
    return;
  }

  const users = await seedUsers(prisma);
  const fields = await seedFields(prisma);
  await seedWeatherData(prisma, fields);
  await seedSensorReadings(prisma, fields);
  await seedMonitoringData(prisma, fields);
  await seedDroneFlights(prisma, fields, users);
  await seedAgronomyReferences(prisma);
  await seedAIDecisions(prisma, fields);
  await seedNotifications(prisma, users, fields);

  console.log('Demo seed completed.');
  console.log('Admin: admin@agricane.com / admin123');
  console.log('Viewer demo: viewer@agricane.com / admin123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
