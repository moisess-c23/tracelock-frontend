import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { VehicleService } from '../../core/services/vehicle.service';
import { VehicleStatusService } from '../../core/services/vehicle-status.service';
import { SwalService } from '../../core/services/swal.service';
import { ThemeService } from '../../core/services/theme.service';
import { Vehicle } from '../../core/models/vehicle.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [NgClass, DecimalPipe, ReactiveFormsModule],
  templateUrl: './fleet.component.html',
  styleUrl: './fleet.component.scss'
})
export class FleetComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private vehicleStatusService = inject(VehicleStatusService);
  private swalService = inject(SwalService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  statuses = computed(() => this.vehicleStatusService.statuses());

  vehicles = computed(() => this.vehicleService.vehicles());
  totalCount = computed(() => this.vehicleService.totalVehiclesCount());
  inRouteCount = computed(() => this.vehicleService.inRouteCount());
  idleCount = computed(() => this.vehicleService.idleCount());
  stoppedCount = computed(() => this.vehicleService.stoppedCount());
  maintenanceCount = computed(() => this.vehicleService.maintenanceCount());

  searchQuery = signal<string>('');
  statusFilter = signal<string | null>(null);

  filteredVehicles = computed(() => {
    let list = this.vehicles();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.plate.toLowerCase().includes(query) ||
        v.driver.toLowerCase().includes(query)
      );
    }

    const status = this.statusFilter();
    if (status) {
      list = list.filter(v => v.status === status);
    }

    return list;
  });

  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isModalExpanded = signal<boolean>(true);
  toggleModalExpand(): void {
    this.isModalExpanded.update(v => !v);
    setTimeout(() => this.pickerMap?.invalidateSize(), 350);
  }
  vehicleForm!: FormGroup;

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.pickerMap && this.pickerTileLayer) {
        this.pickerMap.removeLayer(this.pickerTileLayer);
        this.pickerTileLayer = L.tileLayer(this.tileUrl(isDark), { maxZoom: 18 }).addTo(this.pickerMap);
      }
    });
  }

  private tileUrl(dark: boolean): string {
    return dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  }

  ngOnInit(): void {
    this.vehicleStatusService.loadStatuses();
    this.initForm();
  }

  initForm(): void {
    this.vehicleForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      plate: ['', [Validators.required, Validators.pattern(/^TL-\d{4}-[A-Z]$/)]],
      driver: ['', [Validators.required]],
      statusId: ['', [Validators.required]],
      odometer: [12000, [Validators.required, Validators.min(0)]],
      latitude: [13.693, [Validators.required]],
      longitude: [-89.213, [Validators.required]],
      fuel: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
      battery: [90, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  getBatteryClass(percent: number): string {
    if (percent >= 50) return 'bat-green';
    if (percent >= 15) return 'bat-amber';
    return 'bat-red';
  }

  async deleteVehicle(id: string): Promise<void> {
    const ok = await this.swalService.confirmDelete('vehículo GPS');
    if (ok) this.vehicleService.deleteVehicle(id);
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.isModalExpanded.set(true);
    this.initForm();
    const inRoute = this.vehicleStatusService.findByCode('in_route');
    if (inRoute) {
      this.vehicleForm.patchValue({ statusId: inRoute.id });
    }
    this.isModalOpen.set(true);
    this.initPickerMap();
  }

  openEditModal(vehicle: Vehicle): void {
    this.isEditMode.set(true);
    this.isModalExpanded.set(true);

    this.vehicleForm.patchValue({
      id: vehicle.id,
      name: vehicle.name,
      plate: vehicle.plate,
      driver: vehicle.driver,
      statusId: vehicle.statusId,
      odometer: vehicle.telemetry.odometer,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      fuel: vehicle.telemetry.fuel,
      battery: vehicle.batteryPercent
    });

    this.isModalOpen.set(true);
    this.initPickerMap();
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = undefined;
      this.pickerMarker = undefined;
    }
  }

  onSubmit(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      const missing: string[] = [];
      const c = this.vehicleForm.controls;
      if (c['name'].invalid) missing.push('Nombre / Modelo');
      if (c['plate'].invalid) missing.push('Número de Placa');
      if (c['driver'].invalid) missing.push('Conductor');
      if (c['statusId'].invalid) missing.push('Estatus');
      this.swalService.error(
        'Formulario incompleto',
        missing.length ? `Campos requeridos: ${missing.join(', ')}.` : 'Revisá los campos con error antes de continuar.'
      );
      return;
    }

    const val = this.vehicleForm.value;
    const selectedStatus = this.vehicleStatusService.findById(val.statusId);
    const isInRoute = selectedStatus?.code === 'in_route';

    const payload = {
      name: val.name,
      plate: val.plate,
      driver: val.driver,
      statusId: String(val.statusId),
      status_id: Number(val.statusId),
      latitude: Number(val.latitude),
      longitude: Number(val.longitude),
      initialLatitude: Number(val.latitude),
      initialLongitude: Number(val.longitude),
      initial_latitude: Number(val.latitude),
      initial_longitude: Number(val.longitude),
      speed: isInRoute ? 65 : 0,
      batteryPercent: Number(val.battery),
      telemetry: {
        fuel: Number(val.fuel),
        temp: isInRoute ? 82 : 25,
        odometer: Number(val.odometer)
      }
    };

    try {
      if (this.isEditMode()) {
        this.vehicleService.updateVehicle(val.id, payload);
        this.closeModal();
        this.swalService.success('Vehículo actualizado', `"${val.name}" fue modificado correctamente.`);
      } else {
        this.vehicleService.createVehicle(payload);
        this.closeModal();
        this.swalService.success('Vehículo registrado', `"${val.name}" fue agregado a la flota GPS.`);
      }
    } catch (err: any) {
      this.swalService.error('Error al guardar', err?.message || 'No se pudo guardar el vehículo. Intentá de nuevo.');
    }
  }

  pickerMap?: L.Map;
  private pickerTileLayer?: L.TileLayer;
  pickerMarker?: L.Marker;

  private initPickerMap(): void {
    setTimeout(() => {
      const container = document.getElementById('picker-map');
      if (!container) return;

      if (this.pickerMap) {
        this.pickerMap.remove();
      }

      const initialLat = this.vehicleForm.get('latitude')?.value || 15.5042;
      const initialLng = this.vehicleForm.get('longitude')?.value || -88.0250;

      this.pickerMap = L.map('picker-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([initialLat, initialLng], 13);

      this.pickerTileLayer = L.tileLayer(this.tileUrl(this.themeService.isDarkMode()), {
        maxZoom: 18
      }).addTo(this.pickerMap);

      const customIcon = L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="30px" height="30px" style="transform: translate(-10px, -30px); filter: drop-shadow(0 0 6px #10b98188);">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `,
        className: 'cyber-svg-marker-pin',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      this.pickerMarker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(this.pickerMap);

      if (!this.isEditMode() && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = parseFloat(position.coords.latitude.toFixed(6));
            const userLng = parseFloat(position.coords.longitude.toFixed(6));

            if (this.pickerMap && this.pickerMarker) {
              this.pickerMap.setView([userLat, userLng], 15);
              this.pickerMarker.setLatLng([userLat, userLng]);
              this.vehicleForm.patchValue({
                latitude: userLat,
                longitude: userLng
              });
            }
          },
          (error) => console.log('Geolocation denied or unavailable, using El Salvador default.', error),
          { timeout: 5000 }
        );
      }

      this.pickerMap.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const fixedLat = parseFloat(lat.toFixed(6));
        const fixedLng = parseFloat(lng.toFixed(6));

        this.pickerMarker!.setLatLng([fixedLat, fixedLng]);
        this.vehicleForm.patchValue({
          latitude: fixedLat,
          longitude: fixedLng
        });
      });

      this.pickerMarker.on('dragend', () => {
        const position = this.pickerMarker!.getLatLng();
        const fixedLat = parseFloat(position.lat.toFixed(6));
        const fixedLng = parseFloat(position.lng.toFixed(6));

        this.vehicleForm.patchValue({
          latitude: fixedLat,
          longitude: fixedLng
        });
      });

      setTimeout(() => {
        this.pickerMap?.invalidateSize();
      }, 50);

    }, 150);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'in_route': return 'EN RUTA';
      case 'idle': return 'RALENTÍ';
      case 'stopped': return 'DETENIDO';
      case 'maintenance': return 'TALLER';
      default: return status.toUpperCase();
    }
  }
}
