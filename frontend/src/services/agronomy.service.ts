import api from './api.service';
import { FAOReference, IrrigationRecommendation, SoilHealthAssessment } from '../types';

export const agronomyService = {
  async getAllFAOReferences(): Promise<FAOReference[]> {
    const response = await api.get<FAOReference[]>('/agronomy/fao/all');
    return response.data;
  },

  async getSugarcaneGuidelines(): Promise<any> {
    const response = await api.get<any>('/agronomy/fao/sugarcane');
    return response.data;
  },

  async getOptimalConditions(crop: string = 'sugarcane'): Promise<any> {
    const response = await api.get<any>('/agronomy/optimal-conditions', {
      params: { crop },
    });
    return response.data;
  },

  async getIrrigationRecommendations(
    soilMoisture: number,
    temperature: number,
    cropAge: number
  ): Promise<IrrigationRecommendation> {
    const response = await api.get<IrrigationRecommendation>('/agronomy/irrigation-recommendations', {
      params: { soilMoisture, temperature, cropAge },
    });
    return response.data;
  },

  async getSoilHealthAssessment(
    soilPH: number,
    organicMatter?: number
  ): Promise<SoilHealthAssessment> {
    const response = await api.get<SoilHealthAssessment>('/agronomy/soil-assessment', {
      params: { soilPH, organicMatter },
    });
    return response.data;
  },
};
