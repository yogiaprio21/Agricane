import { HealthStatus } from '@prisma/client';
import { MonitoringService } from './monitoring.service';

describe('MonitoringService business rules', () => {
  const createService = () =>
    new MonitoringService(
      {} as any,
      {
        get: jest.fn(),
      } as any,
      {
        get: jest.fn(),
        set: jest.fn(),
      } as any,
    );

  it.each([
    [0.8, HealthStatus.HEALTHY],
    [0.5, HealthStatus.MODERATE_STRESS],
    [0.3, HealthStatus.SEVERE_STRESS],
    [0.1, HealthStatus.UNKNOWN],
  ])('classifies NDVI value %s as %s', (ndviValue, expectedStatus) => {
    const service = createService() as any;

    expect(service.classifyHealthStatus(ndviValue)).toBe(expectedStatus);
  });
});
