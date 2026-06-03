import api from './api.service';
import { AIDecision, AIDecisionPrerequisites, PaginatedResponse } from '../types';
import { normalizePaginated, unwrapList } from './response.utils';

export const aiService = {
  async getPrerequisites(fieldId: string): Promise<AIDecisionPrerequisites> {
    const response = await api.get<AIDecisionPrerequisites>(`/ai-decision/prerequisites/${fieldId}`);
    return response.data;
  },

  async generateIrrigationDecision(fieldId: string, demo = false): Promise<AIDecision> {
    const response = await api.post<AIDecision>(`/ai-decision/irrigation/${fieldId}`, null, {
      params: { demo },
    });
    return response.data;
  },

  async generateHarvestDecision(fieldId: string): Promise<AIDecision> {
    const response = await api.post<AIDecision>(`/ai-decision/harvest/${fieldId}`);
    return response.data;
  },

  async generateRiskAssessment(fieldId: string): Promise<AIDecision> {
    const response = await api.post<AIDecision>(`/ai-decision/risk-assessment/${fieldId}`);
    return response.data;
  },

  async getHistory(fieldId: string, limit: number = 20): Promise<AIDecision[]> {
    const response = await api.get<AIDecision[] | PaginatedResponse<AIDecision>>(`/ai-decision/history/${fieldId}`, {
      params: { limit },
    });
    return unwrapList(response.data);
  },

  async getHistoryPage(fieldId: string, page = 1, limit = 8): Promise<PaginatedResponse<AIDecision>> {
    const response = await api.get<AIDecision[] | PaginatedResponse<AIDecision>>(`/ai-decision/history/${fieldId}`, {
      params: { page, limit },
    });
    return normalizePaginated(response.data, page, limit);
  },

  async getByType(fieldId: string, type: string): Promise<AIDecision[]> {
    const response = await api.get<AIDecision[]>(`/ai-decision/by-type/${fieldId}`, {
      params: { type },
    });
    return response.data;
  },
};
