import { Injectable, inject, signal } from '@angular/core';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  private api = inject(BaseApiService);

  isSimulating = signal<boolean>(false);

  constructor() {
    this.checkInitialStatus();
    this.syncWithBackendStatus();
  }

  startSimulation() {
    return this.api.post<any>('simulator/start', {});
  }

  stopSimulation() {
    return this.api.post<any>('simulator/stop', {});
  }

  resetSimulation() {
    return this.api.post<any>('simulator/reset', {});
  }

  private checkInitialStatus() {
    const stored = localStorage.getItem('tracelock_simulating');
    this.isSimulating.set(stored === 'true');
  }

  syncWithBackendStatus() {
    this.api.get<any>('simulator/status').subscribe({
      next: (res) => {
        const isRunning = res && (res.status === 'running' || res.running === true);
        this.setSimulatingState(isRunning);
      },
      error: (err) => {
        console.warn('Fallo al sincronizar el estado del simulador con el backend:', err);
      }
    });
  }

  setSimulatingState(state: boolean) {
    this.isSimulating.set(state);
    localStorage.setItem('tracelock_simulating', String(state));
  }
}
