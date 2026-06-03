import api from './api.service';
import { Notification, PaginatedResponse } from '../types';
import { unwrapList } from './response.utils';

export const notificationService = {
  async getAll(filters: {
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
  } = {}): Promise<Notification[]> {
    const response = await api.get<Notification[] | PaginatedResponse<Notification>>('/notifications', {
      params: filters,
    });
    return unwrapList(response.data);
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.data;
  },

  async getById(id: string): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const response = await api.patch<{ updated: number }>('/notifications/mark-all-read');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async getByType(type: string): Promise<Notification[]> {
    const response = await api.get<Notification[]>(`/notifications/by-type/${type}`);
    return response.data;
  },

  async getByPriority(priority: string): Promise<Notification[]> {
    const response = await api.get<Notification[]>(`/notifications/by-priority/${priority}`);
    return response.data;
  },
};
