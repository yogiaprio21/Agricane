import api from './api.service';
import { IntegrationStatusResponse } from '../types';

export const healthService = {
  async getIntegrations(): Promise<IntegrationStatusResponse> {
    const response = await api.get<IntegrationStatusResponse>('/health/integrations');
    return response.data;
  },
};
