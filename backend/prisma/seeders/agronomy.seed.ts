import { PrismaClient } from '@prisma/client';

const references = [
  {
    category: 'irrigation',
    subcategory: 'sugarcane',
    dataType: 'water_requirement',
    content: {
      cropCoefficient: 1.05,
      criticalPeriod: 'grand growth phase',
      waterRequirement: '1500-2500mm per cycle',
      efficiency: 0.75,
    },
    metadata: { source: 'FAO Irrigation and Drainage Paper 56' },
  },
  {
    category: 'soil',
    subcategory: 'optimal_conditions',
    dataType: 'sugarcane_soil',
    content: {
      optimalPH: { min: 6.0, max: 7.5 },
      texture: 'loamy to clay loam',
      drainage: 'well-drained',
      organicMatter: '>2%',
    },
    metadata: { source: 'FAO Soils Portal' },
  },
  {
    category: 'climate',
    subcategory: 'sugarcane',
    dataType: 'optimal_range',
    content: {
      temperature: { min: 20, max: 30, unit: 'celsius' },
      rainfall: { min: 1500, max: 2500, unit: 'mm/year' },
      sunlight: '8-10 hours daily',
    },
    metadata: { source: 'FAO Crop Water Information' },
  },
  {
    category: 'pest_management',
    subcategory: 'sugarcane',
    dataType: 'integrated_approach',
    content: {
      commonPests: ['shoot borer', 'white grub', 'termites'],
      ipmStrategy: 'biological control preferred',
      monitoring: 'weekly field inspection',
    },
    metadata: { source: 'FAO IPM Guidelines' },
  },
] as const;

export async function seedAgronomyReferences(prisma: PrismaClient) {
  for (const reference of references) {
    await prisma.fAOReference.upsert({
      where: {
        category_subcategory_dataType: {
          category: reference.category,
          subcategory: reference.subcategory,
          dataType: reference.dataType,
        },
      },
      update: {
        content: JSON.stringify(reference.content),
        metadata: reference.metadata,
        lastFetchedAt: new Date(),
      },
      create: {
        ...reference,
        content: JSON.stringify(reference.content),
      },
    });
  }
}
