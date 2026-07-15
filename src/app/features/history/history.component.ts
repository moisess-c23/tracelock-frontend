import {
  Component,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { TlSelectComponent, TlSelectOption } from '../../shared/components/tl-select/tl-select.component';

import { VehicleService } from '../../core/services/vehicle.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { ThemeService } from '../../core/services/theme.service';
import { RoutePoint } from '../../core/models/telemetry.model';

const BASE_INTERVAL_MS = 300;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DecimalPipe, FormsModule, TlSelectComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements AfterViewInit, OnDestroy {
  private vehicleService = inject(VehicleService);
  telemetryService    = inject(TelemetryService);
  private themeService    = inject(ThemeService);

  private historyMap?:    L.Map;
  private tileLayer?:     L.TileLayer;
  private routePolyline?: L.Polyline;
  private startMarker?:   L.Marker;
  private endMarker?:     L.Marker;
  private playheadMarker?: L.Marker;
  private animationTimer?: ReturnType<typeof setInterval>;

  selectedVehicleId = signal('');
  selectedDate      = signal('');
  startTime         = signal('00:00');
  endTime           = signal('23:59');

  isPlaying      = signal(false);
  currentIndex   = signal(0);
  playbackSpeed  = signal(1);
  readonly speeds = [1, 2, 4, 8];

  vehicles         = computed(() => this.vehicleService.vehicles());
  availableDates   = computed(() => this.telemetryService.availableDates());
  routeHistory     = computed(() => this.telemetryService.routeHistory());
  isLoadingDates   = computed(() => this.telemetryService.isLoadingDates());
  isLoadingHistory = computed(() => this.telemetryService.isLoadingHistory());
  hasRoute         = computed(() => this.routeHistory().length > 0);

  currentPoint = computed<RoutePoint | null>(() => {
    const h = this.routeHistory();
    return h.length > 0 ? h[this.currentIndex()] : null;
  });

  sliderMax = computed(() => Math.max(0, this.routeHistory().length - 1));

  progressPercent = computed(() => {
    const total = this.routeHistory().length;
    if (total < 2) return 0;
    return Math.round((this.currentIndex() / (total - 1)) * 100);
  });

  selectedVehicleName = computed(() => {
    const id = this.selectedVehicleId();
    const v = this.vehicles().find(v => v.id === id);
    return v ? `${v.plate} — ${v.name}` : '';
  });

  vehicleOptions = computed<TlSelectOption[]>(() =>
    this.vehicles().map(v => ({ value: v.id, label: `${v.plate} — ${v.name}` }))
  );

  dateOptions = computed<TlSelectOption[]>(() =>
    this.availableDates().map(d => ({ value: d, label: d }))
  );

  constructor() {
    effect(() => {
      const id = this.selectedVehicleId();
      untracked(() => {
        this.stop();
        this.clearMapLayers();
        this.telemetryService.clearHistory();
        this.selectedDate.set('');
        if (id) this.telemetryService.getAvailableDates(id);
      });
    });

    effect(() => {
      const route = this.routeHistory();
      if (!this.historyMap || route.length === 0) return;
      this.currentIndex.set(0);
      this.drawRoute(route);
    }, { allowSignalWrites: true });

    effect(() => {
      const dark = this.themeService.isDarkMode();
      if (!this.historyMap || !this.tileLayer) return;
      this.historyMap.removeLayer(this.tileLayer);
      this.tileLayer = L.tileLayer(this.tileUrl(dark), { maxZoom: 19 })
        .addTo(this.historyMap);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  private initMap(): void {
    const el = document.getElementById('history-map');
    if (!el) return;

    this.historyMap = L.map('history-map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([15.5042, -88.025], 13);

    const dark = this.themeService.isDarkMode();
    this.tileLayer = L.tileLayer(this.tileUrl(dark), { maxZoom: 19 })
      .addTo(this.historyMap);
  }

  private tileUrl(dark: boolean): string {
    return dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  }

  loadRoute(): void {
    const vehicleId = this.selectedVehicleId();
    const date      = this.selectedDate();
    if (!vehicleId || !date) return;

    this.stop();
    this.currentIndex.set(0);

    const start = `${date}T${this.startTime()}:00Z`;
    const end   = `${date}T${this.endTime()}:59Z`;

    this.telemetryService.getRouteHistory(vehicleId, start, end);
  }

  togglePlay(): void {
    this.isPlaying() ? this.pause() : this.play();
  }

  play(): void {
    if (!this.hasRoute()) return;
    if (this.currentIndex() >= this.routeHistory().length - 1) {
      this.currentIndex.set(0);
    }
    this.isPlaying.set(true);
    this.scheduleNext();
  }

  private scheduleNext(): void {
    const ms = BASE_INTERVAL_MS / this.playbackSpeed();
    this.animationTimer = setInterval(() => {
      const next  = this.currentIndex() + 1;
      const route = this.routeHistory();
      if (next >= route.length) { this.pause(); return; }
      this.currentIndex.set(next);
      this.movePlayhead(route[next]);
    }, ms);
  }

  pause(): void {
    this.isPlaying.set(false);
    clearInterval(this.animationTimer);
    this.animationTimer = undefined;
  }

  stop(): void {
    this.pause();
    this.currentIndex.set(0);
    const route = this.routeHistory();
    if (route.length > 0) this.movePlayhead(route[0]);
  }

  setSpeed(speed: number): void {
    const wasPlaying = this.isPlaying();
    if (wasPlaying) this.pause();
    this.playbackSpeed.set(speed);
    if (wasPlaying) this.scheduleNext();
  }

  onSliderChange(event: Event): void {
    const idx = Number((event.target as HTMLInputElement).value);
    this.currentIndex.set(idx);
    const pt = this.routeHistory()[idx];
    if (pt) this.movePlayhead(pt);
  }

  private drawRoute(route: RoutePoint[]): void {
    this.clearMapLayers();
    const latlngs = route.map(p => [p.lat, p.lng] as L.LatLngTuple);

    this.routePolyline = L.polyline(latlngs, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.9,
      lineJoin: 'round',
    }).addTo(this.historyMap!);

    this.startMarker = L.marker(latlngs[0], {
      icon: this.pinIcon('#10B981', 'S'),
      zIndexOffset: 100,
    }).bindTooltip('Inicio', { direction: 'top' }).addTo(this.historyMap!);

    this.endMarker = L.marker(latlngs[latlngs.length - 1], {
      icon: this.pinIcon('#EF4444', 'F'),
      zIndexOffset: 100,
    }).bindTooltip('Fin', { direction: 'top' }).addTo(this.historyMap!);

    this.playheadMarker = L.marker(latlngs[0], {
      icon: this.playheadIcon(),
      zIndexOffset: 200,
    }).addTo(this.historyMap!);

    this.historyMap!.fitBounds(
      this.routePolyline.getBounds(),
      { padding: [56, 56] }
    );
  }

  private movePlayhead(point: RoutePoint): void {
    this.playheadMarker?.setLatLng([point.lat, point.lng]);
  }

  private clearMapLayers(): void {
    this.routePolyline?.remove();
    this.startMarker?.remove();
    this.endMarker?.remove();
    this.playheadMarker?.remove();
    this.routePolyline  = undefined;
    this.startMarker    = undefined;
    this.endMarker      = undefined;
    this.playheadMarker = undefined;
  }

  private pinIcon(color: string, label: string): L.DivIcon {
    return L.divIcon({
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:${color};border:2.5px solid rgba(255,255,255,0.9);
        display:flex;align-items:center;justify-content:center;
        font-family:var(--font-mono);font-size:11px;font-weight:700;
        color:#fff;box-shadow:0 2px 12px ${color}99,0 0 0 4px ${color}22;
        transform:translate(-14px,-14px);">${label}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  private playheadIcon(): L.DivIcon {
    return L.divIcon({
      html: `<div style="position:relative;">
        <div style="
          position:absolute;width:44px;height:44px;border-radius:50%;
          background:rgba(245,158,11,0.15);border:1.5px solid rgba(245,158,11,0.4);
          animation:ph-ring 1.6s ease-in-out infinite;
          transform:translate(-22px,-22px);"></div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B"
             width="36px" height="36px"
             style="transform:translate(-18px,-18px);
                    filter:drop-shadow(0 0 8px rgba(245,158,11,0.8));">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34
                   3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83
                   0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5
                   1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5
                   1.5-.67 1.5-1.5 1.5zm2-5.5h-3V9h3v4z"/>
        </svg>
      </div>`,
      className: 'tl-playhead',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  formatDuration(): string {
    const route = this.routeHistory();
    if (route.length < 2) return '—';
    const ms = new Date(route[route.length - 1].recorded_at).getTime()
             - new Date(route[0].recorded_at).getTime();
    const s  = Math.floor(ms / 1000);
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-HN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  formatDateLabel(iso: string | undefined): string {
    return iso ? iso.slice(11, 16) : '';
  }

  ngOnDestroy(): void {
    this.stop();
    this.clearMapLayers();
    this.historyMap?.remove();
    this.telemetryService.clearHistory();
  }
}
