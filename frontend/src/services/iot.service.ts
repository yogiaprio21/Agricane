import api from './api.service';
import { PaginatedResponse, SensorReading, SensorStats } from '../types';
import { unwrapList } from './response.utils';

export const iotService = {
  async getMonitoringData(fieldId: string, hours: number = 24): Promise<{ history: SensorReading[], latest: SensorReading[] }> {
    const [history, latest] = await Promise.all([
      this.getHistory(fieldId, hours),
      this.getLatestReadings(fieldId, 1)
    ]);
    return { history, latest };
  },

  async getLatestReadings(fieldId: string, limit: number = 20): Promise<SensorReading[]> {
    const response = await api.get<SensorReading[]>(`/iot/readings/${fieldId}/latest`, {
      params: { limit },
    });
    return response.data;
  },

  async getHistory(fieldId: string, hours: number = 24): Promise<SensorReading[]> {
    const response = await api.get<SensorReading[] | PaginatedResponse<SensorReading>>(`/iot/readings/${fieldId}/history`, {
      params: { hours },
    });
    return unwrapList(response.data);
  },

  async getStats(fieldId: string, hours: number = 24): Promise<SensorStats> {
    const response = await api.get<SensorStats>(`/iot/readings/${fieldId}/stats`, {
      params: { hours },
    });
    return response.data;
  },

  async getAnomalies(fieldId: string, hours: number = 24): Promise<any[]> {
    const response = await api.get(`/iot/readings/${fieldId}/anomalies`, {
      params: { hours },
    });
    return unwrapList(response.data);
  },

  async simulate(fieldId: string): Promise<SensorReading> {
    const response = await api.post<SensorReading>(`/iot/simulate/${fieldId}`);
    return response.data;
  },
};
