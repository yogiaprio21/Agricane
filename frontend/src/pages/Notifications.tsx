import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  IconButton,
  PageHeader,
  Select,
  Spinner,
} from '../components/common';
import { notificationService } from '../services/notification.service';
import { Notification, NotificationType, NotificationPriority } from '../types';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, Cloud, Activity } from 'lucide-react';
import { format } from 'date-fns';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter, typeFilter, priorityFilter]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getAll({
        unreadOnly: filter === 'unread',
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      await notificationService.delete(notificationToDelete.id);
      setNotificationToDelete(null);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getPriorityVariant = (priority: NotificationPriority | string) => {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'danger';
      case NotificationPriority.HIGH: return 'warning';
      case NotificationPriority.MEDIUM: return 'info';
      case NotificationPriority.LOW: return 'success';
      default: return 'info';
    }
  };

  const getTypeIcon = (type: NotificationType | string) => {
    switch (type) {
      case NotificationType.WEATHER_ALERT: return <Cloud size={24} className="text-blue-600" />;
      case NotificationType.IOT_ANOMALY: return <Activity size={24} className="text-orange-600" />;
      case NotificationType.HARVEST_READY: return <AlertTriangle size={24} className="text-green-600" />;
      case NotificationType.HEALTH_DEGRADATION: return <AlertTriangle size={24} className="text-red-600" />;
      default: return <Info size={24} className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <PageHeader
        title="Notifications"
        description="System alerts and notifications"
      />

      <DataToolbar>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[12rem_12rem_auto]">
          <Select
            label="Type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[
              { value: NotificationType.WEATHER_ALERT, label: 'Weather alert' },
              { value: NotificationType.IOT_ANOMALY, label: 'IoT anomaly' },
              { value: NotificationType.HARVEST_READY, label: 'Harvest ready' },
              { value: NotificationType.HEALTH_DEGRADATION, label: 'Health degradation' },
              { value: NotificationType.SYSTEM_INFO, label: 'System info' },
            ]}
            className="mb-0"
          />
          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            options={[
              { value: NotificationPriority.LOW, label: 'Low' },
              { value: NotificationPriority.MEDIUM, label: 'Medium' },
              { value: NotificationPriority.HIGH, label: 'High' },
              { value: NotificationPriority.CRITICAL, label: 'Critical' },
            ]}
            className="mb-0"
          />
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="secondary" leftIcon={<CheckCheck size={18} />} className="self-end">
              Mark All as Read
            </Button>
          )}
        </div>
      </DataToolbar>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.isRead ? 'border-l-4 border-primary-600' : ''}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPriorityVariant(notification.priority) as any}>
                          {notification.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <IconButton
                          label={`Mark ${notification.title} as read`}
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="primary"
                        >
                          <Check size={20} />
                        </IconButton>
                      )}
                      <IconButton
                        label={`Delete ${notification.title}`}
                        onClick={() => setNotificationToDelete(notification)}
                        variant="danger"
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap">
                    {notification.message}
                  </p>

                  {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Additional Information:</p>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(notification.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={56} />}
          title="No notifications"
          description={
            filter === 'unread'
              ? "You're all caught up. No unread notifications."
              : "You don't have any notifications yet."
          }
        />
      )}

      <ConfirmDialog
        isOpen={!!notificationToDelete}
        title="Delete notification"
        description={`Delete notification "${notificationToDelete?.title || 'selected notification'}"?`}
        confirmLabel="Delete notification"
        onConfirm={handleConfirmDelete}
        onClose={() => setNotificationToDelete(null)}
      />
    </Layout>
  );
};
