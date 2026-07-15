import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { NgClass, NgStyle, DatePipe, DecimalPipe } from '@angular/common';
import { GeofenceService } from '../../core/services/geofence.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { SwalService } from '../../core/services/swal.service';
import { ThemeService } from '../../core/services/theme.service';
import { Geofence, GeofenceType } from '../../core/models/geofence.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-geofences',
  standalone: true,
  imports: [NgClass, NgStyle, DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './geofences.component.html',
  styleUrl: './geofences.component.scss'
})
export class GeofencesComponent implements OnInit {
  private geofenceService = inject(GeofenceService);
  private vehicleService = inject(VehicleService);
  private swalService = inject(SwalService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  geofences = computed(() => this.geofenceService.geofences());
  vehicles = computed(() => this.vehicleService.vehicles());

  selectedFence = signal<Geofence | null>(null);

  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isModalExpanded = signal<boolean>(true);
  toggleModalExpand(): void { this.isModalExpanded.update(v => !v); }

  geofenceForm!: FormGroup;
  assignedVehicles = signal<string[]>([]);

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.drawMap && this.drawTileLayer) {
        this.drawMap.removeLayer(this.drawTileLayer);
        this.drawTileLayer = L.tileLayer(this.tileUrl(isDark), { maxZoom: 18 }).addTo(this.drawMap);
      }
    });
  }

  private tileUrl(dark: boolean): string {
    return dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  }

  ngOnInit(): void {
    this.initForm();

    const list = this.geofences();
    if (list.length > 0) {
      this.selectedFence.set(list[0]);
    }
  }

  initForm(): void {
    this.geofenceForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['polygon', Validators.required],
      zoneType: ['permitted', Validators.required],
      severity: ['low', Validators.required],
      color: ['#10b981', Validators.required],
      coordinates: [[], [Validators.required, Validators.minLength(3)]],
      geoJson: [null]
    });
  }

  selectFence(fence: Geofence): void {
    this.selectedFence.set(fence);
  }

  async toggleActive(fence: Geofence): Promise<void> {
    const action = fence.isActive ? 'desactivar' : 'activar';
    const title = fence.isActive ? '¿Desactivar geocerca?' : '¿Activar geocerca?';
    const text = fence.isActive
      ? `El perímetro "${fence.name}" dejará de monitorear eventos de ingreso/egreso.`
      : `El perímetro "${fence.name}" comenzará a registrar eventos y alertas activamente.`;

    const ok = await this.swalService.confirmAction(title, text,
      fence.isActive ? 'Sí, desactivar' : 'Sí, activar'
    );
    if (ok) {
      this.geofenceService.toggleGeofence(fence.id, fence.isActive);
    }
  }

  async deleteFence(id: string): Promise<void> {
    const ok = await this.swalService.confirmDelete('geocerca');
    if (ok) {
      this.geofenceService.deleteGeofence(id);
      if (this.selectedFence()?.id === id) this.selectedFence.set(null);
    }
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.isModalExpanded.set(true);
    this.initForm();
    this.assignedVehicles.set([]);
    this.isModalOpen.set(true);
  }

  openEditModal(fence: Geofence): void {
    this.isEditMode.set(true);
    this.isModalExpanded.set(true);

    const resolvedCoords = this.getFenceCoordinates(fence);

    this.geofenceForm.patchValue({
      id: fence.id,
      name: fence.name,
      description: fence.description,
      type: 'polygon',
      color: fence.color,
      zoneType: fence.zoneType || 'permitted',
      severity: fence.severity || 'low',
      coordinates: resolvedCoords,
      geoJson: fence.geoJson
    });

    this.assignedVehicles.set([...fence.vehicleIds]);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    if (this.drawMap) {
      this.drawMap.remove();
      this.drawMap = undefined;
      this.drawPolygon = undefined;
      this.drawMarkers = [];
      this.drawPoints = [];
    }
  }

  isVehicleAssigned(vehicleId: string): boolean {
    return this.assignedVehicles().includes(vehicleId);
  }

  onVehicleToggle(vehicleId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.assignedVehicles.update(list => {
      if (isChecked) {
        return [...list, vehicleId];
      } else {
        return list.filter(id => id !== vehicleId);
      }
    });
  }

  onSubmit(): void {
    if (this.geofenceForm.invalid) {
      this.geofenceForm.markAllAsTouched();
      const coords = this.geofenceForm.get('coordinates')?.value;
      const nameInvalid = this.geofenceForm.get('name')?.invalid;
      if (!coords || coords.length < 3) {
        this.swalService.error(
          'Perímetro sin definir',
          'Trazá al menos 3 vértices en el mapa para constituir una geocerca válida.'
        );
      } else if (nameInvalid) {
        this.swalService.error('Nombre requerido', 'Ingresá un nombre para el sector (mínimo 3 caracteres).');
      } else {
        this.swalService.error('Formulario incompleto', 'Revisá todos los campos antes de guardar.');
      }
      return;
    }

    const val = this.geofenceForm.value;
    const geofencePayload = {
      name: val.name,
      description: val.description,
      type: 'polygon' as GeofenceType,
      zoneType: val.zoneType,
      severity: val.severity,
      coordinates: val.coordinates,
      isActive: true,
      color: val.color,
      vehicleIds: this.assignedVehicles(),
      geoJson: val.geoJson
    };

    try {
      if (this.isEditMode()) {
        this.geofenceService.updateGeofence(val.id, geofencePayload);
        this.closeModal();
        const list = this.geofences();
        if (list.length > 0) this.selectedFence.set(list[list.length - 1]);
        this.swalService.success('Geocerca actualizada', `El perímetro "${val.name}" fue modificado correctamente.`);
      } else {
        this.geofenceService.createGeofence(geofencePayload);
        this.closeModal();
        const list = this.geofences();
        if (list.length > 0) this.selectedFence.set(list[list.length - 1]);
        this.swalService.success('Geocerca guardada', `El perímetro "${val.name}" fue registrado en el sistema.`);
      }
    } catch (err: any) {
      this.swalService.error('Error al guardar', err?.message || 'No se pudo guardar la geocerca. Intentá de nuevo.');
    }
  }

  drawMap?: L.Map;
  private drawTileLayer?: L.TileLayer;
  drawPolygon?: L.Polygon;
  drawPoints: L.LatLng[] = [];
  drawMarkers: L.Marker[] = [];

  private readonly minLat = 15.46;
  private readonly maxLat = 15.54;
  private readonly minLng = -88.06;
  private readonly maxLng = -87.98;

  lngToX(lng: number | undefined): number {
    if (lng === undefined || lng === null) return 0;
    const percentage = ((lng - this.minLng) / (this.maxLng - this.minLng)) * 100;
    return parseFloat(percentage.toFixed(4));
  }

  latToY(lat: number | undefined): number {
    if (lat === undefined || lat === null) return 0;
    const percentage = (1 - (lat - this.minLat) / (this.maxLat - this.minLat)) * 100;
    return parseFloat(percentage.toFixed(4));
  }

  radiusToSVG(radiusInMeters: number): number {
    const svgUnit = (radiusInMeters / 6660) * 100;
    return parseFloat(svgUnit.toFixed(4));
  }

  getPolygonPoints(coords: { lat: number, lng: number }[]): string {
    if (!coords || coords.length === 0) return '';
    return coords.map(c => `${this.lngToX(c.lng)},${this.latToY(c.lat)}`).join(' ');
  }

  getFenceCoordinates(fence: Geofence | null): { lat: number, lng: number }[] {
    if (!fence) return [];
    if (fence.coordinates && fence.coordinates.length > 0) {
      return fence.coordinates;
    }
    if (fence.geometry && fence.geometry.coordinates && fence.geometry.coordinates.length > 0) {
      const ring = fence.geometry.coordinates[0];
      return ring.map((pt: any) => ({ lat: pt[1], lng: pt[0] }));
    }
    if (fence.geoJson && fence.geoJson.geometry && fence.geoJson.geometry.coordinates && fence.geoJson.geometry.coordinates.length > 0) {
      const ring = fence.geoJson.geometry.coordinates[0];
      return ring.map((pt: any) => ({ lat: pt[1], lng: pt[0] }));
    }
    return [];
  }

  getFirstCoordinate(fence: Geofence | null): { lat: number, lng: number } | null {
    const coords = this.getFenceCoordinates(fence);
    return coords.length > 0 ? coords[0] : null;
  }

  private initDrawMap(): void {
    setTimeout(() => {
      const container = document.getElementById('geofence-draw-map');
      if (!container) return;

      if (this.drawMap) {
        this.drawMap.remove();
      }

      const centerLat = 15.5042;
      const centerLng = -88.0250;

      this.drawMap = L.map('geofence-draw-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([centerLat, centerLng], 13);

      this.drawTileLayer = L.tileLayer(this.tileUrl(this.themeService.isDarkMode()), {
        maxZoom: 18
      }).addTo(this.drawMap);

      this.drawPoints = [];
      this.drawMarkers = [];

      const themeColor = this.geofenceForm.get('color')?.value || '#10b981';
      this.drawPolygon = L.polygon([], {
        color: themeColor,
        fillColor: themeColor,
        fillOpacity: 0.25,
        weight: 2
      }).addTo(this.drawMap);

      const currentCoords = this.geofenceForm.get('coordinates')?.value || [];
      if (currentCoords.length > 0) {
        currentCoords.forEach((c: {lat: number, lng: number}) => {
          const latlng = L.latLng(c.lat, c.lng);
          this.addVertex(latlng);
        });

        if (this.drawPoints.length > 0) {
          const bounds = L.latLngBounds(this.drawPoints);
          this.drawMap.fitBounds(bounds, { padding: [30, 30] });
        }
      } else if (!this.isEditMode() && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            if (this.drawMap) {
              this.drawMap.setView([userLat, userLng], 15);
            }
          },
          (error) => console.log('Geolocation denied, staying at San Salvador center.', error),
          { timeout: 5000 }
        );
      }

      this.drawMap.on('click', (e: L.LeafletMouseEvent) => {
        this.addVertex(e.latlng);
      });
    }, 150);
  }

  private addVertex(latlng: L.LatLng): void {
    this.drawPoints.push(latlng);
    const index = this.drawPoints.length - 1;

    const themeColor = this.geofenceForm.get('color')?.value || '#10b981';

    const marker = L.marker(latlng, {
      draggable: true,
      icon: L.divIcon({
        className: 'geofence-vertex-marker',
        html: `<div style="background-color: ${themeColor}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    }).addTo(this.drawMap!);

    marker.on('drag', (e: any) => {
      const newLatLng = e.target.getLatLng();
      this.drawPoints[index] = newLatLng;
      if (this.drawPolygon) {
        this.drawPolygon.setLatLngs(this.drawPoints);
      }
      this.updateFormValues();
    });

    marker.on('dragend', () => {
      this.updateFormValues();
    });

    this.drawMarkers.push(marker);
    if (this.drawPolygon) {
      this.drawPolygon.setLatLngs(this.drawPoints);
    }
    this.updateFormValues();
  }

  private updateFormValues(): void {
    const coordsPayload = this.drawPoints.map(p => ({
      lat: parseFloat(p.lat.toFixed(6)),
      lng: parseFloat(p.lng.toFixed(6))
    }));

    const geoJsonCoords = this.drawPoints.map(p => [parseFloat(p.lng.toFixed(6)), parseFloat(p.lat.toFixed(6))]);
    if (geoJsonCoords.length >= 3) {
      geoJsonCoords.push([geoJsonCoords[0][0], geoJsonCoords[0][1]]);
    }
    const geoJsonPayload = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [geoJsonCoords]
      },
      properties: {}
    };

    this.geofenceForm.patchValue({
      coordinates: coordsPayload,
      geoJson: geoJsonPayload
    });
    this.geofenceForm.get('coordinates')?.markAsDirty();
  }

  clearDrawing(): void {
    this.drawPoints = [];
    this.drawMarkers.forEach(m => m.remove());
    this.drawMarkers = [];
    if (this.drawPolygon) {
      this.drawPolygon.setLatLngs([]);
    }
    this.geofenceForm.patchValue({ coordinates: [] });
  }

  updateDrawingColor(): void {
    const themeColor = this.geofenceForm.get('color')?.value || '#10b981';
    if (this.drawPolygon) {
      this.drawPolygon.setStyle({
        color: themeColor,
        fillColor: themeColor
      });
    }
    this.drawMarkers.forEach(m => {
      m.setIcon(L.divIcon({
        className: 'geofence-vertex-marker',
        html: `<div style="background-color: ${themeColor}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      }));
    });
  }

  overrideOpenCreateModal = (() => {
    const orig = this.openCreateModal;
    this.openCreateModal = () => {
      orig.call(this);
      this.initDrawMap();
    };
  })();

  overrideOpenEditModal = (() => {
    const orig = this.openEditModal;
    this.openEditModal = (f: Geofence) => {
      orig.call(this, f);
      this.initDrawMap();
    };
  })();
}
