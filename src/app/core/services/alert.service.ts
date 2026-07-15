import { Injectable, inject, signal, computed } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Alert, AlertSeverity } from '../models/alert.model';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private api = inject(BaseApiService);
  private notificationService = inject(NotificationService);

  private alertsSignal = signal<Alert[]>([]);
  alerts = computed(() => this.alertsSignal());
  systemResetEvent = signal<number>(0);
  vehicleUpdateEvent = signal<any | null>(null);
  isConnected = signal<boolean>(false);

  unreadCount = computed(() => this.alertsSignal().filter(a => !a.resolved).length);
  criticalCount = computed(() => this.alertsSignal().filter(a => a.severity === 'critical' && !a.resolved).length);

  private ws?: WebSocket;

  constructor() {
    this.loadAlerts();
    this.connectWebSocket();
  }

  private stripEmojis(text: string): string {
    try {
      return text.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim();
    } catch {
      return text.replace(/[\u{1F000}-\u{1FFFF}]|[☀-⟿]/gu, '').trim();
    }
  }

  private sanitize(a: Alert): Alert {
    return { ...a, message: this.stripEmojis(a.message) };
  }

  loadAlerts(): void {
    this.api.get<Alert[]>('alerts').subscribe({
      next: (data) => {
        const formatted = data.map(a => this.sanitize({ ...a, timestamp: new Date(a.timestamp) }));
        this.alertsSignal.set(formatted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      },
      error: (err) => console.error('Error cargando alertas:', err)
    });
  }

  resolveAlert(id: string): void {
    this.api.put<Alert>('alerts', { resolved: true }, id).subscribe({
      next: () => {
        this.alertsSignal.update(list =>
          list.map(a => a.id === id ? { ...a, resolved: true } : a)
        );
      },
      error: (err) => console.error('Error resolviendo alerta:', err)
    });
  }

  clearAllAlerts(): void {
    this.api.delete<void>('alerts').subscribe({
      next: () => this.alertsSignal.set([]),
      error: (err) => console.error('Error limpiando alertas:', err)
    });
  }

  private showToastNotification(alert: Alert): void {
    const typeMap: Record<AlertSeverity, 'error' | 'warning' | 'info'> = {
      critical: 'error',
      warning: 'warning',
      info: 'info'
    };
    this.notificationService.show(alert.message, typeMap[alert.severity]);
  }

  private connectWebSocket(): void {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = '';
    try {
      const url = new URL(environment.apiUrl);
      wsUrl = `${wsProtocol}//${url.host}${url.pathname}/ws/alerts`;
    } catch {
      wsUrl = `ws://localhost:8080/api/v1/ws/alerts`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected.set(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'SYSTEM_RESET') {
          this.alertsSignal.set([]);
          this.systemResetEvent.update(n => n + 1);
          return;
        }

        if (msg.type === 'VEHICLE_UPDATE') {
          this.vehicleUpdateEvent.set(msg.vehicle);
          return;
        }

        if (msg.type === 'NEW_ALERT' && msg.alert) {
          const newAlert: Alert = this.sanitize({ ...msg.alert, timestamp: new Date(msg.alert.timestamp) });
          this.alertsSignal.update(list => {
            if (list.some(a => a.id === newAlert.id)) return list;
            return [newAlert, ...list].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          });
          this.showToastNotification(newAlert);
        }
      } catch (e) {
        console.error('Error parsing real-time alert:', e);
      }
    };

    this.ws.onclose = () => {
      this.isConnected.set(false);
      console.warn('WebSocket cerrado. Reintentando en 5 segundos...');
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.ws.onerror = () => {
      this.isConnected.set(false);
    };
  }

  ngOnDestroy(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
