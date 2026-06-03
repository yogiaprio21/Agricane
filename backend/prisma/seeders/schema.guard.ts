import { PrismaClient } from '@prisma/client';

export async function assertDatabaseSchemaReady(prisma: PrismaClient) {
  const roles = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = '"Role"'::regtype
  `;

  if (!roles.some((role) => role.enumlabel === 'VIEWER')) {
    throw new Error(
      [
        'Database schema is not ready for demo seed: enum Role is missing VIEWER.',
        'Development: run `npm run prisma:migrate:dev`.',
        'Neon/production: run `npm run prisma:migrate:deploy`, then run the seed again.',
      ].join(' '),
    );
  }

  const locationColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'fields' AND column_name = 'locationName'
  `;

  if (locationColumns.length === 0) {
    throw new Error(
      [
        'Database schema is not ready for demo seed: fields.locationName column is missing.',
        'Apply the latest Prisma migration before running seed.',
      ].join(' '),
    );
  }
}
