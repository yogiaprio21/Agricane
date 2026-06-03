import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const WS_NAMESPACE = `${WS_URL.replace(/\/$/, '')}/iot`;

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (!this.socket) {
      this.socket = io(WS_NAMESPACE, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToField(fieldId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe_field', { fieldId });
    }
  }

  unsubscribeFromField(fieldId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe_field', { fieldId });
    }
  }

  onSensorUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('sensor_update', callback);
    }
  }

  onSensorAnomaly(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('sensor_anomaly', callback);
    }
  }

  onNewNotification(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('new_notification', callback);
    }
  }

  onConnectionChange(callback: (isConnected: boolean) => void): void {
    if (this.socket) {
      this.socket.on('connect', () => callback(true));
      this.socket.on('disconnect', () => callback(false));
      this.socket.on('connect_error', () => callback(false));
      callback(this.socket.connected);
    }
  }

  offSensorUpdate(callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('sensor_update', callback);
    }
  }

  offSensorAnomaly(callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('sensor_anomaly', callback);
    }
  }

  offNewNotification(callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('new_notification', callback);
    }
  }

  offConnectionChange(): void {
    if (this.socket) {
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();
