import api from './api.service';
import { NDVIData, DroneFlight, FieldHealth, PaginatedResponse } from '../types';
import { unwrapList } from './response.utils';

export const monitoringService = {
  async fetchNDVI(fieldId: string): Promise<NDVIData> {
    const response = await api.post<NDVIData>(`/monitoring/ndvi/fetch/${fieldId}`);
    return response.data;
  },

  async getNDVIHistory(fieldId: string, days: number = 30): Promise<NDVIData[]> {
    const response = await api.get<NDVIData[] | PaginatedResponse<NDVIData>>(`/monitoring/ndvi/history/${fieldId}`, {
      params: { days },
    });
    return unwrapList(response.data);
  },

  async getHealthTrend(fieldId: string): Promise<any> {
    const response = await api.get(`/monitoring/health/trend/${fieldId}`);
    return response.data;
  },

  async getHealthSummary(): Promise<FieldHealth[]> {
    const response = await api.get<FieldHealth[]>('/monitoring/health/summary');
    return response.data;
  },

  async createDroneFlight(data: Partial<DroneFlight>): Promise<DroneFlight> {
    const response = await api.post<DroneFlight>('/monitoring/drone/flights', data);
    return response.data;
  },

  async getDroneFlights(fieldId: string): Promise<DroneFlight[]> {
    const response = await api.get<DroneFlight[] | PaginatedResponse<DroneFlight>>(`/monitoring/drone/flights/${fieldId}`);
    return unwrapList(response.data);
  },

  async updateDroneFlight(id: string, data: Partial<DroneFlight>): Promise<DroneFlight> {
    const response = await api.patch<DroneFlight>(`/monitoring/drone/flight/${id}`, data);
    return response.data;
  },

  async deleteDroneFlight(id: string): Promise<void> {
    await api.delete(`/monitoring/drone/flight/${id}`);
  },
};
