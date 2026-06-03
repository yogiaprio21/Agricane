import { GrowthStatus, PrismaClient } from '@prisma/client';

const demoFields = [
  {
    name: 'East Block C3',
    latitude: -7.2445,
    longitude: 112.7812,
    locationName: 'Gading, Tambaksari, Surabaya',
    areaHectares: 18.7,
    sugarcaneVariety: 'Co 0238',
    plantingDate: new Date('2024-05-10'),
    growthStatus: GrowthStatus.GROWING,
  },
  {
    name: 'North Block A1',
    latitude: -7.2504,
    longitude: 112.7688,
    locationName: 'Pacar Keling, Tambaksari, Surabaya',
    areaHectares: 25.5,
    sugarcaneVariety: 'VMC 76-16',
    plantingDate: new Date('2024-03-15'),
    growthStatus: GrowthStatus.GROWING,
  },
  {
    name: 'South Block B2',
    latitude: -7.2578,
    longitude: 112.7755,
    locationName: 'Mojo, Gubeng, Surabaya',
    areaHectares: 32,
    sugarcaneVariety: 'PS 881',
    plantingDate: new Date('2023-09-20'),
    growthStatus: GrowthStatus.HARVEST_READY,
  },
  {
    name: 'West Trial D4',
    latitude: -7.2631,
    longitude: 112.7596,
    locationName: 'Airlangga, Gubeng, Surabaya',
    areaHectares: 14.4,
    sugarcaneVariety: 'Bululawang',
    plantingDate: new Date('2025-01-12'),
    growthStatus: GrowthStatus.PLANTED,
  },
  {
    name: 'River Edge E5',
    latitude: -7.2392,
    longitude: 112.7901,
    locationName: 'Kenjeran, Surabaya',
    areaHectares: 21.9,
    sugarcaneVariety: 'PS 862',
    plantingDate: new Date('2023-08-18'),
    growthStatus: GrowthStatus.HARVEST_READY,
  },
] as const;

export type SeededFields = Awaited<ReturnType<typeof seedFields>>;

export async function seedFields(prisma: PrismaClient) {
  const fields = [];

  for (const field of demoFields) {
    fields.push(await prisma.field.create({ data: field }));
  }

  return fields;
}
