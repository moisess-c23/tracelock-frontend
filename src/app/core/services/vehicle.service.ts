import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Vehicle } from '../models/vehicle.model';
import { interval, Subscription } from 'rxjs';
import { AlertService } from './alert.service';
import { SimulatorService } from './simulator.service';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private api = inject(BaseApiService);
  private alertService = inject(AlertService);
  private simulatorService = inject(SimulatorService);

  private vehiclesSignal = signal<Vehicle[]>([]);
  private selectedVehicleSignal = signal<Vehicle | null>(null);

  vehicles = computed(() => this.vehiclesSignal());
  selectedVehicle = computed(() => this.selectedVehicleSignal());

  totalVehiclesCount = computed(() => this.vehiclesSignal().length);
  inRouteCount = computed(() => this.vehiclesSignal().filter(v => v.status === 'in_route').length);
  idleCount = computed(() => this.vehiclesSignal().filter(v => v.status === 'idle').length);
  stoppedCount = computed(() => this.vehiclesSignal().filter(v => v.status === 'stopped').length);
  maintenanceCount = computed(() => this.vehiclesSignal().filter(v => v.status === 'maintenance').length);

  private pollingSub?: Subscription;

  constructor() {
    this.loadVehicles();

    effect(() => {
      const simulating = this.simulatorService.isSimulating();

      if (this.pollingSub) {
        this.pollingSub.unsubscribe();
        this.pollingSub = undefined;
      }

      const rate = simulating ? 2000 : 5000;
      this.pollingSub = interval(rate).subscribe(() => {
        this.loadVehiclesSilent();
      });
    });

    effect(() => {
      const resetCount = this.alertService.systemResetEvent();
      if (resetCount > 0) {
        this.loadVehicles();
        this.selectVehicle(null);
      }
    });

    effect(() => {
      const update = this.alertService.vehicleUpdateEvent();
      if (update) {
        this.vehiclesSignal.update(list =>
          list.map(v => {
            if (v.id === update.id) {
              const updatedObj = {
                ...v,
                ...update,
                lastUpdated: new Date(update.lastUpdated || Date.now())
              };
              const currentSelected = this.selectedVehicleSignal();
              if (currentSelected && currentSelected.id === v.id) {
                this.selectedVehicleSignal.set(updatedObj);
              }
              return updatedObj;
            }
            return v;
          })
        );
      }
    });
  }

  loadVehicles(): void {
    this.api.get<Vehicle[]>('vehicles').subscribe({
      next: (data) => {
        this.vehiclesSignal.set(data.map(v => ({ ...v, lastUpdated: new Date(v.lastUpdated) })));
      },
      error: (err) => console.error('Error cargando vehículos:', err)
    });
  }

  selectVehicle(vehicle: Vehicle | null): void {
    this.selectedVehicleSignal.set(vehicle);
  }

  createVehicle(vehicle: Partial<Vehicle> & { statusId: string }): void {
    this.api.post<Vehicle>('vehicles', vehicle).subscribe({
      next: (created) => {
        this.vehiclesSignal.update(list => [...list, { ...created, lastUpdated: new Date(created.lastUpdated) }]);
      },
      error: (err) => console.error('Error creando vehículo:', err)
    });
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): void {
    this.api.put<Vehicle>('vehicles', updates, id).subscribe({
      next: (updated) => {
        this.vehiclesSignal.update(list =>
          list.map(v => v.id === id ? { ...v, ...updated, lastUpdated: new Date() } : v)
        );
        const currentSelected = this.selectedVehicleSignal();
        if (currentSelected && currentSelected.id === id) {
          this.selectedVehicleSignal.set({ ...currentSelected, ...updated, lastUpdated: new Date() });
        }
      },
      error: (err) => console.error('Error editando vehículo:', err)
    });
  }

  deleteVehicle(id: string): void {
    this.api.delete('vehicles', id).subscribe({
      next: () => {
        this.vehiclesSignal.update(list => list.filter(v => v.id !== id));
        if (this.selectedVehicleSignal()?.id === id) {
          this.selectedVehicleSignal.set(null);
        }
      },
      error: (err) => console.error('Error eliminando vehículo:', err)
    });
  }

  private loadVehiclesSilent(): void {
    this.api.get<Vehicle[]>('vehicles').subscribe({
      next: (data) => {
        const formatted = data.map(v => ({ ...v, lastUpdated: new Date(v.lastUpdated) }));
        this.vehiclesSignal.set(formatted);

        const currentSelected = this.selectedVehicleSignal();
        if (currentSelected) {
          const match = formatted.find(v => v.id === currentSelected.id);
          if (match) {
            this.selectedVehicleSignal.set(match);
          }
        }
      },
      error: (err) => console.error('Error al actualizar vehículos periódicamente:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
