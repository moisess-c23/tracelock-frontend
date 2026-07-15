import { Injectable, inject, signal } from '@angular/core';
import { BaseApiService } from './base-api.service';
import {
  AvailableDatesResponse,
  RouteHistoryResponse,
  RoutePoint,
} from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private api = inject(BaseApiService);

  availableDates = signal<string[]>([]);
  routeHistory = signal<RoutePoint[]>([]);
  isLoadingDates = signal(false);
  isLoadingHistory = signal(false);

  getAvailableDates(vehicleId: string): void {
    this.isLoadingDates.set(true);
    this.availableDates.set([]);

    this.api.get<AvailableDatesResponse>(`telemetry/dates/${vehicleId}`).subscribe({
      next: (res) => {
        this.availableDates.set(res.dates ?? []);
        this.isLoadingDates.set(false);
      },
      error: (err) => {
        console.error('TelemetryService.getAvailableDates:', err);
        this.isLoadingDates.set(false);
      },
    });
  }

  getRouteHistory(vehicleId: string, start: string, end: string): void {
    this.isLoadingHistory.set(true);
    this.routeHistory.set([]);

    const path = `telemetry/history?vehicle_id=${vehicleId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    this.api.get<RouteHistoryResponse>(path).subscribe({
      next: (res) => {
        this.routeHistory.set(res.route ?? []);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        console.error('TelemetryService.getRouteHistory:', err);
        this.isLoadingHistory.set(false);
      },
    });
  }

  clearHistory(): void {
    this.routeHistory.set([]);
    this.availableDates.set([]);
  }
}
