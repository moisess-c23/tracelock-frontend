import { Injectable, inject, signal, computed } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Geofence } from '../models/geofence.model';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private api = inject(BaseApiService);

  private geofencesSignal = signal<Geofence[]>([]);
  geofences = computed(() => this.geofencesSignal());

  activeGeofencesCount = computed(() => this.geofencesSignal().filter(g => g.isActive).length);

  constructor() {
    this.loadGeofences();
  }

  loadGeofences(): void {
    this.api.get<Geofence[]>('geofences').subscribe({
      next: (data) => {
        this.geofencesSignal.set(data.map(g => ({ ...g, createdAt: new Date(g.createdAt) })));
      },
      error: (err) => console.error('Error cargando geocercas:', err)
    });
  }

  createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): void {
    this.api.post<Geofence>('geofences', geofence).subscribe({
      next: (created) => {
        this.geofencesSignal.update(list => [...list, { ...created, createdAt: new Date(created.createdAt) }]);
      },
      error: (err) => console.error('Error creando geocerca:', err)
    });
  }

  updateGeofence(id: string, updates: Partial<Geofence>): void {
    this.api.put<Geofence>('geofences', updates, id).subscribe({
      next: (updated) => {
        this.geofencesSignal.update(list =>
          list.map(g => g.id === id ? { ...g, ...updated } : g)
        );
      },
      error: (err) => console.error('Error editando geocerca:', err)
    });
  }

  toggleGeofence(id: string, currentStatus: boolean): void {
    this.updateGeofence(id, { isActive: !currentStatus });
  }

  deleteGeofence(id: string): void {
    this.api.delete('geofences', id).subscribe({
      next: () => {
        this.geofencesSignal.update(list => list.filter(g => g.id !== id));
      },
      error: (err) => console.error('Error eliminando geocerca:', err)
    });
  }
}
