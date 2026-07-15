import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from '../../core/services/alert.service';
import { SwalService } from '../../core/services/swal.service';
import { Alert, AlertSeverity } from '../../core/models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private swalService = inject(SwalService);
  private route = inject(ActivatedRoute);
  private routeSub?: Subscription;

  alerts = computed(() => this.alertService.alerts());

  totalAlertsCount = computed(() => this.alerts().length);
  criticalCount = computed(() => this.alerts().filter(a => a.severity === 'critical').length);
  warningCount = computed(() => this.alerts().filter(a => a.severity === 'warning').length);
  infoCount = computed(() => this.alerts().filter(a => a.severity === 'info').length);

  searchText = signal<string>('');
  severityFilter = signal<AlertSeverity | null>(null);
  hideResolved = signal<boolean>(false);

  highlightId = signal<string | null>(null);
  highlightActive = signal<boolean>(false);
  private highlightTimer?: ReturnType<typeof setTimeout>;

  filteredAlerts = computed(() => {
    let list = this.alerts();
    const text = this.searchText().toLowerCase().trim();
    if (text) {
      list = list.filter(a =>
        a.message.toLowerCase().includes(text) ||
        a.vehicleName.toLowerCase().includes(text) ||
        (a.geofenceName && a.geofenceName.toLowerCase().includes(text))
      );
    }
    const severity = this.severityFilter();
    if (severity) list = list.filter(a => a.severity === severity);
    if (this.hideResolved()) list = list.filter(a => !a.resolved);
    return list;
  });

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      const id = params['highlight'];
      if (!id) return;

      this.hideResolved.set(false);
      this.severityFilter.set(null);
      this.highlightId.set(id);

      clearTimeout(this.highlightTimer);
      this.highlightActive.set(false);

      this.highlightTimer = setTimeout(() => {
        const el = document.getElementById(`alert-${id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightActive.set(true);

        this.highlightTimer = setTimeout(() => {
          this.highlightActive.set(false);
        }, 3200);
      }, 350);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    clearTimeout(this.highlightTimer);
  }

  updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchText.set(val);
  }

  acknowledge(id: string): void {
    this.alertService.resolveAlert(id);
    this.swalService.success('Registro sellado', 'El evento fue marcado como atendido en la bitácora.');
  }

  async clearLogs(): Promise<void> {
    const ok = await this.swalService.confirmAction(
      '¿Limpiar bitácora completa?',
      'Se eliminarán todos los registros históricos de alertas. Esta acción no se puede deshacer.',
      'Sí, limpiar todo'
    );
    if (!ok) return;
    this.alertService.clearAllAlerts();
    this.swalService.success('Bitácora limpiada', 'Todos los registros fueron eliminados correctamente.');
  }
}
