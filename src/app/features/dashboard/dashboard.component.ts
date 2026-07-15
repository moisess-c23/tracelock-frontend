import { Component, inject, signal, computed, AfterViewInit, effect } from '@angular/core';
import { NgClass, NgStyle, DatePipe, DecimalPipe } from '@angular/common';
import { VehicleService } from '../../core/services/vehicle.service';
import { GeofenceService } from '../../core/services/geofence.service';
import { AlertService } from '../../core/services/alert.service';
import { ThemeService } from '../../core/services/theme.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { Geofence, GeofenceType } from '../../core/models/geofence.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgStyle, DatePipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit {
  private vehicleService = inject(VehicleService);
  private geofenceService = inject(GeofenceService);
  private alertService = inject(AlertService);
  private themeService = inject(ThemeService);
  private tileLayer?: L.TileLayer;
  isFleetPanelOpen = signal<boolean>(true);

  showGrid = signal<boolean>(true);
  showStreets = signal<boolean>(true);
  showGeofences = signal<boolean>(true);

  dashboardMap?: L.Map;
  private vehicleLayerGroup = L.featureGroup();
  private geofenceLayerGroup = L.featureGroup();
  private vehicleMarkersMap = new Map<string, L.Marker>();
  private polygonsMap = new Map<string, L.Polygon>();

  constructor() {
    effect(() => {
      this.syncVehicles();
    });

    effect(() => {
      this.syncGeofences();
    });

    effect(() => {
      this.selectedVehicle();

      if (this.dashboardMap) {
        setTimeout(() => {
          this.dashboardMap?.invalidateSize();
        }, 120);
      }
    });

    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.dashboardMap && this.tileLayer) {
        this.dashboardMap.removeLayer(this.tileLayer);
        const url = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        this.tileLayer = L.tileLayer(url, { maxZoom: 18 });
        this.tileLayer.addTo(this.dashboardMap);
        this.vehicleLayerGroup.bringToFront();
        this.geofenceLayerGroup.bringToFront();
      }
    });
  }

  toggleFleetPanel(): void {
    this.isFleetPanelOpen.update(v => !v);
    setTimeout(() => this.dashboardMap?.invalidateSize(), 320);
  }

  ngAfterViewInit(): void {
    this.initDashboardMap();
  }

  private initDashboardMap(): void {
    setTimeout(() => {
      const container = document.getElementById('dashboard-map');
      if (!container) return;

      if (this.dashboardMap) {
        this.dashboardMap.remove();
      }

      this.dashboardMap = L.map('dashboard-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([15.5042, -88.0250], 13);

      const tileUrl = this.themeService.isDarkMode()
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      this.tileLayer = L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(this.dashboardMap);

      this.vehicleLayerGroup.addTo(this.dashboardMap);
      this.geofenceLayerGroup.addTo(this.dashboardMap);

      this.syncGeofences();
      this.syncVehicles();
    }, 150);
  }

  private syncVehicles(): void {
    const vehiclesList = this.vehicles();
    if (!this.dashboardMap) return;

    const activeIds = new Set(vehiclesList.map(v => v.id));

    const getStatusIcon = (status: string, plate: string) => {
      let color = '#9ca3af';
      if (status === 'in_route') color = '#10b981';
      else if (status === 'idle') color = '#f59e0b';
      else if (status === 'stopped') color = '#ef4444';
      else if (status === 'maintenance') color = '#2563eb';

      return L.divIcon({
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="34px" height="34px" style="transform: translate(-17px, -17px); filter: drop-shadow(0 0 6px ${color}dd);">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2-5.5h-3V9h3v4z"/>
            </svg>
            <div style="position: absolute; top: 18px; left: -25px; width: 50px; text-align: center; font-family: var(--font-mono); font-size: 7.5px; font-weight: 700; color: #ffffff; background: rgba(12,14,18,0.9); border: 1px solid ${color}88; padding: 1px 3px; border-radius: 4px; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
              ${plate}
            </div>
          </div>
        `,
        className: 'cyber-dashboard-marker-truck',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    vehiclesList.forEach(vehicle => {
      const position = L.latLng(vehicle.latitude, vehicle.longitude);

      if (this.vehicleMarkersMap.has(vehicle.id)) {
        const marker = this.vehicleMarkersMap.get(vehicle.id)!;
        marker.setLatLng(position);
        marker.setIcon(getStatusIcon(vehicle.status, vehicle.plate));

        const currentSelected = this.selectedVehicle();
        if (currentSelected && currentSelected.id === vehicle.id && vehicle.status === 'in_route') {
          this.dashboardMap?.panTo(position);
        }
      } else {
        const marker = L.marker(position, {
          icon: getStatusIcon(vehicle.status, vehicle.plate)
        }).addTo(this.vehicleLayerGroup);

        marker.on('click', () => {
          this.selectVehicle(vehicle);
        });

        this.vehicleMarkersMap.set(vehicle.id, marker);
      }
    });

    this.vehicleMarkersMap.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        this.vehicleLayerGroup.removeLayer(marker);
        this.vehicleMarkersMap.delete(id);
      }
    });
  }

  private syncGeofences(): void {
    const geofencesList = this.geofences();
    if (!this.dashboardMap) return;

    const show = this.showGeofences();
    const activeIds = new Set(geofencesList.filter(g => g.isActive && show).map(g => g.id));

    geofencesList.forEach(fence => {
      if (!fence) return;

      if (fence.isActive && show) {
        let latlngs: L.LatLngExpression[] = [];

        if (fence.geoJson && fence.geoJson.geometry && fence.geoJson.geometry.coordinates && fence.geoJson.geometry.coordinates.length > 0) {
          const ring = fence.geoJson.geometry.coordinates[0];
          if (Array.isArray(ring)) {
            latlngs = ring
              .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
              .map((pt: any) => [Number(pt[1]), Number(pt[0])]) as L.LatLngExpression[];
          }
        } else if (fence.geometry && fence.geometry.coordinates && fence.geometry.coordinates.length > 0) {
          const ring = fence.geometry.coordinates[0];
          if (Array.isArray(ring)) {
            latlngs = ring
              .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
              .map((pt: any) => [Number(pt[1]), Number(pt[0])]) as L.LatLngExpression[];
          }
        } else if (fence.coordinates && fence.coordinates.length > 0) {
          latlngs = fence.coordinates
            .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number')
            .map(c => [c.lat, c.lng]) as L.LatLngExpression[];
        }

        if (latlngs.length === 0) return;

        if (this.polygonsMap.has(fence.id)) {
          const polygon = this.polygonsMap.get(fence.id)!;
          polygon.setLatLngs(latlngs);
          polygon.setStyle({ color: fence.color, fillColor: fence.color });
        } else {
          const polygon = L.polygon(latlngs, {
            color: fence.color,
            fillColor: fence.color,
            fillOpacity: 0.08,
            weight: 1.5,
            className: 'glowing-geofence'
          }).addTo(this.geofenceLayerGroup);

          polygon.bindTooltip(`
            <div style="font-family: var(--font-sans); color: #ffffff; padding: 2px;">
              <strong style="color: var(--color-cyan); font-size: 0.8rem;">${fence.name}</strong><br>
              <span style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">
                Zona ${fence.zoneType === 'permitted' ? 'Permitida' : 'Prohibida'} (${fence.severity})
              </span>
            </div>
          `, {
            sticky: true,
            className: 'custom-leaflet-tooltip'
          });

          this.polygonsMap.set(fence.id, polygon);
        }
      }
    });

    this.polygonsMap.forEach((polygon, id) => {
      if (!activeIds.has(id)) {
        this.geofenceLayerGroup.removeLayer(polygon);
        this.polygonsMap.delete(id);
      }
    });
  }

  vehicles = computed(() => this.vehicleService.vehicles());
  geofences = computed(() => this.geofenceService.geofences());
  selectedVehicle = computed(() => this.vehicleService.selectedVehicle());

  totalVehicles = computed(() => this.vehicleService.totalVehiclesCount());
  inRoute = computed(() => this.vehicleService.inRouteCount());
  stopped = computed(() => this.vehicleService.stoppedCount());
  activeGeofences = computed(() => this.geofenceService.activeGeofencesCount());

  latestAlert = computed(() => {
    const unread = this.alertService.alerts().filter(a => !a.resolved);
    return unread.length > 0 ? unread[0] : null;
  });

  searchQuery = signal<string>('');
  filterStatus = signal<string | null>(null);

  filteredVehicles = computed(() => {
    let list = this.vehicles();

    const search = this.searchQuery().toLowerCase().trim();
    if (search) {
      list = list.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.plate.toLowerCase().includes(search) ||
        v.driver.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status) {
      list = list.filter(v => v.status === status);
    }

    return list;
  });

  updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  selectVehicle(vehicle: Vehicle | null): void {
    this.vehicleService.selectVehicle(vehicle);
  }

  resetView(): void {
    this.vehicleService.selectVehicle(null);
    this.filterStatus.set(null);
    this.searchQuery.set('');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'in_route': return 'var(--color-in-route)';
      case 'idle': return 'var(--color-idle)';
      case 'stopped': return 'var(--color-stopped)';
      case 'maintenance': return 'var(--color-maintenance)';
      default: return '#9ca3af';
    }
  }

  getSpeedGaugeOffset(speed: number): number {
    const maxSpeed = 120;
    const currentSpeed = Math.min(speed, maxSpeed);
    const fraction = currentSpeed / maxSpeed;
    const offset = 251.2 - (fraction * 251.2);
    return parseFloat(offset.toFixed(2));
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'in_route': return 'EN RUTA';
      case 'idle': return 'RALENTÍ';
      case 'stopped': return 'DETENIDO';
      case 'maintenance': return 'MANTENIMIENTO';
      default: return status.toUpperCase();
    }
  }
}
