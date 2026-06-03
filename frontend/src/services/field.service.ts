import api from './api.service';
import { Field, PaginatedResponse } from '../types';
import { unwrapList } from './response.utils';

export const fieldService = {
  async getAll(): Promise<Field[]> {
    const response = await api.get<Field[] | PaginatedResponse<Field>>('/fields');
    return unwrapList(response.data);
  },

  async getById(id: string): Promise<Field> {
    const response = await api.get<Field>(`/fields/${id}`);
    return response.data;
  },

  async create(data: Partial<Field>): Promise<Field> {
    const response = await api.post<Field>('/fields', data);
    return response.data;
  },

  async update(id: string, data: Partial<Field>): Promise<Field> {
    const response = await api.patch<Field>(`/fields/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fields/${id}`);
  },

  async updateGrowthStatus(id: string, status: string): Promise<Field> {
    const response = await api.patch<Field>(`/fields/${id}/growth-status`, { status });
    return response.data;
  },
};
