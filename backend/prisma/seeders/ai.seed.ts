import { GrowthStatus, PrismaClient } from '@prisma/client';
import { SeededFields } from './fields.seed';
import { daysAgo } from './time';

const ndviByField = [0.68, 0.58, 0.47, 0.62, 0.36];

export async function seedAIDecisions(prisma: PrismaClient, fields: SeededFields) {
  const rows = fields.flatMap((field, fieldIndex) => [
    {
      fieldId: field.id,
      decisionType: 'IRRIGATION',
      recommendation: fieldIndex === 4 ? 'SCHEDULE_IRRIGATION_24H' : 'MAINTAIN_CURRENT_SCHEDULE',
      explanation:
        fieldIndex === 4
          ? 'Soil moisture is below target range and recent rainfall is insufficient. Schedule irrigation within 24 hours.'
          : 'Weather, soil, and NDVI inputs are within operational thresholds. Continue current irrigation cadence.',
      confidence: fieldIndex === 4 ? 0.82 : 0.9,
      contextData: { sourceMode: 'seeded_demo', field: field.name },
      weatherFactors: { temperature: 29 + fieldIndex, humidity: 72 - fieldIndex, rainfall: fieldIndex === 4 ? 0 : 1.2 },
      soilFactors: { moisture: fieldIndex === 4 ? 36 : 58, pH: 6.8 },
      ndviFactors: { ndvi: ndviByField[fieldIndex] },
      faoReferences: { waterRequirement: '1500-2500mm per cycle' },
      createdAt: daysAgo(fieldIndex + 1, 15),
    },
    {
      fieldId: field.id,
      decisionType: 'HARVEST_READINESS',
      recommendation: field.growthStatus === GrowthStatus.HARVEST_READY ? 'READY_FOR_HARVEST_WINDOW' : 'MONITOR_CROP_DEVELOPMENT',
      explanation:
        field.growthStatus === GrowthStatus.HARVEST_READY
          ? 'Crop age and vegetation trend indicate the field is ready for harvest planning.'
          : 'Crop is still developing. Continue monitoring crop age, NDVI trend, and rainfall pattern.',
      confidence: field.growthStatus === GrowthStatus.HARVEST_READY ? 0.88 : 0.76,
      contextData: { sourceMode: 'seeded_demo', field: field.name },
      createdAt: daysAgo(fieldIndex + 2, 14),
    },
    {
      fieldId: field.id,
      decisionType: 'RISK_ASSESSMENT',
      recommendation: fieldIndex === 4 ? 'MODERATE_HEALTH_RISK' : 'LOW',
      explanation:
        fieldIndex === 4
          ? 'Low NDVI and dry sensor trend indicate moderate stress risk. Prioritize field inspection.'
          : 'No significant risk detected from latest weather, soil, and vegetation readings.',
      confidence: fieldIndex === 4 ? 0.81 : 0.87,
      contextData: { sourceMode: 'seeded_demo', field: field.name },
      ndviFactors: { ndvi: ndviByField[fieldIndex] },
      createdAt: daysAgo(fieldIndex + 3, 13),
    },
  ]);

  await prisma.aIDecision.createMany({ data: rows });
}
