import { HealthStatus, PrismaClient } from '@prisma/client';
import { SeededFields } from './fields.seed';
import { daysAgo } from './time';

function ndviStatus(value: number): HealthStatus {
  if (value > 0.6) return HealthStatus.HEALTHY;
  if (value >= 0.4) return HealthStatus.MODERATE_STRESS;
  return HealthStatus.SEVERE_STRESS;
}

export async function seedMonitoringData(prisma: PrismaClient, fields: SeededFields) {
  const baseValues = [0.68, 0.58, 0.47, 0.62, 0.36];
  const rows = fields.flatMap((field, fieldIndex) =>
    Array.from({ length: 24 }, (_, index) => {
      const value = Math.max(0.25, Math.min(0.82, baseValues[fieldIndex] + Math.sin(index / 4) * 0.04));

      return {
        fieldId: field.id,
        ndviValue: value,
        healthStatus: ndviStatus(value),
        captureDate: daysAgo(index * 3, 10),
        source: fieldIndex === 0 ? 'Copernicus Sentinel-2 (Simulated)' : 'Copernicus Sentinel-2',
        satellitePass: `S2-${fieldIndex + 1}-${index + 1}`,
        cloudCover: Math.max(3, Math.min(28, 12 + Math.cos(index / 2) * 9)),
        metadata: {
          sourceType: fieldIndex === 0 ? 'SIMULATED' : 'LIVE',
          apiStatus: fieldIndex === 0 ? 'fallback_simulated' : 'cached_live_reference',
          provider: 'Copernicus Sentinel-2',
        },
      };
    }),
  );

  await prisma.nDVIData.createMany({ data: rows });
}
