import { IotService } from './iot.service';

describe('IotService business rules', () => {
  const createService = () =>
    new IotService(
      {} as any,
      {
        create: jest.fn(),
      } as any,
      {
        emitSensorUpdate: jest.fn(),
        emitSensorAnomaly: jest.fn(),
      } as any,
    );

  it('identifies low moisture, acidic pH, and high temperature anomalies', () => {
    const service = createService() as any;

    const anomalies = service.identifyAnomalies({
      soilMoisture: 20,
      soilPH: 5,
      soilTemperature: 40,
    });

    expect(anomalies).toEqual(['low_moisture', 'acidic_soil', 'high_temperature']);
  });

  it('does not flag readings inside the configured IoT thresholds', () => {
    const service = createService() as any;

    const anomalies = service.identifyAnomalies({
      soilMoisture: 55,
      soilPH: 6.8,
      soilTemperature: 27,
    });

    expect(anomalies).toEqual([]);
  });
});
