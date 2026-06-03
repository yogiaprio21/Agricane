import api from './api.service';
import { PaginatedResponse, WeatherData, WeatherForecastResponse, WeatherStats } from '../types';
import { unwrapList } from './response.utils';

export const environmentalService = {
  async fetchWeather(fieldId: string): Promise<WeatherData> {
    const response = await api.post<WeatherData>(`/environmental/fetch/${fieldId}`);
    return response.data;
  },

  async getHistory(fieldId: string, days: number = 7): Promise<WeatherData[]> {
    const response = await api.get<WeatherData[] | PaginatedResponse<WeatherData>>(`/environmental/history/${fieldId}`, {
      params: { days },
    });
    return unwrapList(response.data);
  },

  async getStats(fieldId: string, days: number = 30): Promise<WeatherStats> {
    const response = await api.get<WeatherStats>(`/environmental/stats/${fieldId}`, {
      params: { days },
    });
    return response.data;
  },

  async getForecast(fieldId: string, slots: number = 8): Promise<WeatherForecastResponse> {
    const response = await api.get<WeatherForecastResponse>(`/environmental/forecast/${fieldId}`, {
      params: { slots },
    });
    return response.data;
  },
};
