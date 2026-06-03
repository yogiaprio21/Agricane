import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

type Listener<T> = (payload: T) => void;

export interface SensorUpdateEvent {
  fieldId: string;
  reading: unknown;
  timestamp: Date;
}

export interface SensorAnomalyEvent {
  fieldId: string;
  anomaly: unknown;
  timestamp: Date;
}

export interface NotificationEvent {
  notification: unknown;
  userId?: string | null;
}

@Injectable()
export class RealtimeEventsService {
  private readonly emitter = new EventEmitter();

  emitSensorUpdate(payload: SensorUpdateEvent) {
    this.emitter.emit('sensor_update', payload);
  }

  onSensorUpdate(listener: Listener<SensorUpdateEvent>) {
    this.emitter.on('sensor_update', listener);
    return () => this.emitter.off('sensor_update', listener);
  }

  emitSensorAnomaly(payload: SensorAnomalyEvent) {
    this.emitter.emit('sensor_anomaly', payload);
  }

  onSensorAnomaly(listener: Listener<SensorAnomalyEvent>) {
    this.emitter.on('sensor_anomaly', listener);
    return () => this.emitter.off('sensor_anomaly', listener);
  }

  emitNotification(payload: NotificationEvent) {
    this.emitter.emit('new_notification', payload);
  }

  onNotification(listener: Listener<NotificationEvent>) {
    this.emitter.on('new_notification', listener);
    return () => this.emitter.off('new_notification', listener);
  }
}
