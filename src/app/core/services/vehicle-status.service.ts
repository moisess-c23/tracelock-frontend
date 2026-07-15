import { Injectable, inject, signal, computed } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { VehicleStatusOption, VehicleStatusCode } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleStatusService {
  private api = inject(BaseApiService);

  private statusesSignal = signal<VehicleStatusOption[]>([]);

  statuses = computed(() => this.statusesSignal());

  loadStatuses(): void {
    this.api.get<VehicleStatusOption[]>('statuses').subscribe({
      next: (data) => this.statusesSignal.set(data),
      error: (err) => console.error('Error cargando catálogo de estados:', err)
    });
  }

  findByCode(code: VehicleStatusCode): VehicleStatusOption | undefined {
    return this.statusesSignal().find(s => s.code === code);
  }

  findById(id: string | number): VehicleStatusOption | undefined {
    const target = String(id);
    return this.statusesSignal().find(s => s.id === target);
  }
}
