import { Component, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SimulatorService } from '../../../core/services/simulator.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SwalService } from '../../../core/services/swal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink],
  template: `
    <header class="header">
      <div class="header-left">

        <button 
          class="btn-sim" 
          [class.btn-sim-active]="simulatorService.isSimulating()" 
          (click)="toggleSimulation()"
          [title]="simulatorService.isSimulating() ? 'Detener simulación de telemetría GPS' : 'Iniciar simulación de telemetría GPS'"
        >
          @if (simulatorService.isSimulating()) {
            <span class="btn-sim-dot pulse-amber"></span>
            <svg class="btn-sim-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <span class="btn-sim-text">Detener Simulación</span>
          } @else {
            <span class="btn-sim-dot"></span>
            <svg class="btn-sim-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span class="btn-sim-text">Iniciar Simulación GPS</span>
          }
        </button>

        @if (!simulatorService.isSimulating()) {
          <button 
            class="btn-reset" 
            (click)="resetSystem()"
            title="Reiniciar al estado inicial"
          >
            <svg class="btn-reset-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            <span class="btn-reset-text">Reset</span>
          </button>
        }
      </div>

      <div class="header-right">

        <button class="icon-btn theme-toggle-btn" (click)="toggleTheme($event)" [title]="themeService.isDarkMode() ? 'Activar Modo Claro' : 'Activar Modo Oscuro'">
          @if (themeService.isDarkMode()) {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        </button>

        <div class="notification-wrapper">
          <button class="icon-btn" (click)="toggleDropdown()" [class.active]="isDropdownOpen()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            @if (unreadCount() > 0) {
              <span class="badge-count">{{ unreadCount() }}</span>
            }
          </button>

          @if (isDropdownOpen()) {
            <div class="notification-dropdown">
              <div class="dropdown-header">
                <div class="dh-left">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="dh-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h3>Notificaciones</h3>
                </div>
                @if (unreadCount() > 0) {
                  <button class="mark-all-btn" (click)="markAllSeen()">Marcar todas vistas</button>
                } @else {
                  <span class="all-clear-lbl">Al día</span>
                }
              </div>

              <div class="dropdown-body">
                @if (recentAlerts().length === 0) {
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="empty-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Sin alertas pendientes</span>
                  </div>
                } @else {
                  @for (alert of recentAlerts(); track alert.id) {
                    <div class="notification-item"
                         [class.unread]="isBellUnseen(alert.id) && !alert.resolved"
                         [class.seen]="!isBellUnseen(alert.id) && !alert.resolved"
                         [class.resolved]="alert.resolved"
                         [ngClass]="'sev-' + alert.severity"
                         (click)="onNotificationClick(alert.id)">
                      <div class="sev-bar"></div>
                      <div class="item-body">
                        <div class="item-top-row">
                          <span class="sev-chip">{{ alert.severity }}</span>
                          <span class="alert-time">{{ alert.timestamp | date:'HH:mm' }}</span>
                        </div>
                        <p class="alert-msg">{{ cleanMessage(alert.message) }}</p>
                        <span class="alert-source">{{ alert.type.replace('_', ' ') }}</span>
                      </div>
                      @if (isBellUnseen(alert.id) && !alert.resolved) {
                        <div class="unread-dot"></div>
                      } @else if (alert.resolved) {
                        <svg class="read-check" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      }
                    </div>
                  }
                }
              </div>

              <div class="dropdown-footer">
                <a routerLink="/alerts" (click)="isDropdownOpen.set(false)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Ver bitácora completa
                </a>
              </div>
            </div>
          }
        </div>

      </div>
    </header>
  `,
  styles: [`
    .header {
      background: var(--bg-header);
      backdrop-filter: blur(20px) saturate(1.4);
      -webkit-backdrop-filter: blur(20px) saturate(1.4);
      border-bottom: 1px solid var(--border-color);
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.75rem;
      position: sticky;
      top: 0;
      z-index: 9;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-sim {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--btn-secondary-bg);
      border: 1px solid var(--btn-secondary-border);
      color: var(--btn-secondary-color);
      padding: 0.4rem 1rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      font-family: var(--font-sans);
      letter-spacing: -0.01em;

      &:hover {
        background: var(--btn-secondary-hover-bg);
        border-color: var(--border-hover);
        color: var(--text-main);
      }

      .btn-sim-dot {
        width: 6px;
        height: 6px;
        background-color: var(--text-muted);
        border-radius: 50%;
        transition: var(--transition-fast);
      }

      .btn-sim-icon {
        width: 14px;
        height: 14px;
      }

      .btn-sim-text { font-size: 0.78rem; }
    }

    .btn-sim-active {
      animation: breathing-pulse 2s infinite ease-in-out;
      color: var(--color-idle);

      .btn-sim-dot {
        background-color: var(--color-idle);
        box-shadow: 0 0 8px var(--color-idle);
        animation: pulse-warning 2s infinite;
      }
    }

    @keyframes breathing-pulse {
      0%   { border-color: rgba(245, 166, 35, 0.25); background: rgba(245, 166, 35, 0.04); box-shadow: none; }
      50%  { border-color: rgba(245, 166, 35, 0.6);  background: rgba(245, 166, 35, 0.08); box-shadow: 0 0 14px rgba(245, 166, 35, 0.2); }
      100% { border-color: rgba(245, 166, 35, 0.25); background: rgba(245, 166, 35, 0.04); box-shadow: none; }
    }

    .btn-reset {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(240, 67, 101, 0.05);
      border: 1px solid rgba(240, 67, 101, 0.20);
      color: rgba(240, 100, 130, 0.85);
      padding: 0.4rem 0.9rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      font-family: var(--font-sans);

      &:hover {
        background: rgba(240, 67, 101, 0.12);
        border-color: rgba(240, 67, 101, 0.45);
        color: var(--color-stopped);
        box-shadow: 0 0 12px rgba(240, 67, 101, 0.15);
      }

      .btn-reset-icon {
        width: 14px;
        height: 14px;
        transition: transform 0.5s ease;
      }

      &:hover .btn-reset-icon { transform: rotate(-180deg); }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .divider-v {
      width: 1px;
      height: 22px;
      background: var(--border-color);
    }

    .notification-wrapper { position: relative; }

    .icon-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-fast);
      position: relative;

      svg { width: 18px; height: 18px; }

      &:hover, &.active {
        background: var(--btn-secondary-hover-bg);
        color: var(--text-main);
        border-color: var(--border-hover);
      }

      .badge-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--color-stopped);
        color: #ffffff;
        font-family: var(--font-mono);
        font-size: 0.60rem;
        font-weight: 700;
        width: 17px;
        height: 17px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--bg-panel);
        box-shadow: var(--glow-red);
      }
    }

    .theme-toggle-btn:hover {
      color: var(--color-idle) !important;
      border-color: rgba(245, 166, 35, 0.35) !important;
    }

    .notification-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      box-shadow: var(--modal-shadow);
      border-radius: 16px;
      overflow: hidden;
      z-index: 100;
      animation: dropdown-fade-in 0.20s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes dropdown-fade-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dropdown-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.18);

      .dh-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .dh-icon {
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      h3 {
        font-size: 0.84rem;
        font-weight: 700;
        color: var(--text-main);
        letter-spacing: -0.02em;
      }
    }

    .mark-all-btn {
      background: transparent;
      border: none;
      color: var(--color-primary-light);
      font-size: 0.70rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-sans);
      padding: 0;
      transition: var(--transition-fast);
      &:hover { opacity: 0.75; }
    }

    .all-clear-lbl {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      color: var(--color-in-route);
      background: rgba(16, 185, 129, 0.10);
      border: 1px solid rgba(16, 185, 129, 0.20);
      padding: 0.15rem 0.55rem;
      border-radius: 5px;
      font-weight: 600;
    }

    .dropdown-body {
      max-height: 310px;
      overflow-y: auto;
    }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.80rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;

      .empty-icon {
        width: 32px;
        height: 32px;
        color: var(--color-in-route);
        opacity: 0.5;
      }
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: var(--transition-fast);
      position: relative;
      overflow: hidden;

      &:last-child { border-bottom: none; }

      &.unread {
        background: rgba(255, 255, 255, 0.025);
        &:hover { background: rgba(255, 255, 255, 0.05); }
      }

      &.seen {
        opacity: 0.65;
        &:hover { opacity: 0.85; background: rgba(255, 255, 255, 0.03); }
      }

      &.resolved {
        opacity: 0.38;
        cursor: pointer;
        .alert-msg { color: var(--text-muted); }
      }

      &:hover { background: rgba(255, 255, 255, 0.04); }

      &.sev-critical .sev-bar { background: var(--color-stopped); }
      &.sev-warning  .sev-bar { background: var(--color-idle); }
      &.sev-info     .sev-bar { background: var(--color-cyan); }
    }

    .sev-bar {
      width: 3px;
      align-self: stretch;
      flex-shrink: 0;
      border-radius: 0;
    }

    .item-body {
      flex: 1;
      padding: 0.85rem 0.75rem 0.85rem 0.875rem;
      min-width: 0;
    }

    .item-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .sev-chip {
      font-size: 0.60rem;
      font-family: var(--font-mono);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
    }

    .notification-item.sev-critical .sev-chip { color: var(--color-stopped); }
    .notification-item.sev-warning  .sev-chip { color: var(--color-idle); }
    .notification-item.sev-info     .sev-chip { color: var(--color-cyan); }

    .alert-time {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      color: var(--text-muted);
    }

    .alert-msg {
      font-size: 0.80rem;
      color: var(--text-main);
      line-height: 1.4;
      margin-bottom: 0.25rem;
      word-break: break-word;
    }

    .alert-source {
      font-size: 0.63rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-mono);
    }

    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-primary-light);
      box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
      flex-shrink: 0;
      margin: 1rem 0.875rem 0 0;
    }

    .read-check {
      width: 14px;
      height: 14px;
      color: var(--color-in-route);
      flex-shrink: 0;
      margin: 1rem 0.875rem 0 0;
      opacity: 0.5;
    }

    .dropdown-footer {
      border-top: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.12);

      a {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.8rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--color-primary-light);
        text-decoration: none;
        transition: var(--transition-fast);

        svg {
          width: 14px;
          height: 14px;
        }

        &:hover {
          background: rgba(59, 130, 246, 0.06);
          color: var(--color-primary-light);
        }
      }
    }
  `]
})
export class HeaderComponent {
  private alertService = inject(AlertService);
  public themeService = inject(ThemeService);
  public simulatorService = inject(SimulatorService);
  private notificationService = inject(NotificationService);
  private swalService = inject(SwalService);
  private elRef = inject(ElementRef);
  private router = inject(Router);

  isDropdownOpen = signal<boolean>(false);

  private seenIds = signal<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('bell_seen_ids') ?? '[]'))
  );

  unreadCount = computed(() =>
    this.alertService.alerts().filter(a => !a.resolved && !this.seenIds().has(a.id)).length
  );

  recentAlerts = computed(() => this.alertService.alerts().slice(0, 5));

  isBellUnseen(id: string): boolean {
    return !this.seenIds().has(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(val => !val);
  }

  onNotificationClick(id: string): void {
    this.markSeen(id);
    this.isDropdownOpen.set(false);
    this.router.navigate(['/alerts'], { queryParams: { highlight: id } });
  }

  markAllSeen(): void {
    const next = new Set(this.seenIds());
    this.alertService.alerts()
      .filter(a => !a.resolved)
      .forEach(a => next.add(a.id));
    this.persistSeen(next);
  }

  private markSeen(id: string): void {
    const next = new Set(this.seenIds());
    next.add(id);
    this.persistSeen(next);
  }

  private persistSeen(ids: Set<string>): void {
    this.seenIds.set(ids);
    localStorage.setItem('bell_seen_ids', JSON.stringify([...ids]));
  }

  cleanMessage(text: string): string {
    return text
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  toggleTheme(event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    document.documentElement.style.setProperty('--ripple-x', `${x}px`);
    document.documentElement.style.setProperty('--ripple-y', `${y}px`);

    if (!('startViewTransition' in document)) {
      this.themeService.toggleTheme();
      return;
    }

    (document as any).startViewTransition(() => {
      this.themeService.toggleTheme();
    });
  }

  toggleSimulation() {
    if (this.simulatorService.isSimulating()) {
      this.simulatorService.stopSimulation().subscribe({
        next: () => {
          this.simulatorService.setSimulatingState(false);
          this.notificationService.show('Simulación GPS detenida', 'warning');
        },
        error: (err) => {
          console.error('Error stopping simulation:', err);
          this.notificationService.show('Error al detener la simulación', 'error');
        }
      });
    } else {
      this.simulatorService.startSimulation().subscribe({
        next: () => {
          this.simulatorService.setSimulatingState(true);
          this.notificationService.show('Simulación GPS iniciada', 'success');
        },
        error: (err) => {
          console.error('Error starting simulation:', err);
          this.notificationService.show('Error al iniciar la simulación', 'error');
        }
      });
    }
  }

  async resetSystem(): Promise<void> {
    const ok = await this.swalService.confirmAction(
      '¿Reiniciar el sistema?',
      'Esto restablecerá las posiciones y telemetría de todos los vehículos al estado inicial.',
      'Sí, reiniciar'
    );
    if (!ok) return;

    this.swalService.loading('Reiniciando...', 'Restableciendo telemetría al estado inicial');
    this.simulatorService.resetSimulation().subscribe({
      next: () => {
        this.swalService.close();
        this.alertService.clearAllAlerts();
        this.alertService.systemResetEvent.update(n => n + 1);
        this.notificationService.show('Sistema restablecido al estado inicial', 'success');
      },
      error: (err) => {
        this.swalService.close();
        console.error('Error resetting system:', err);
        const errMsg = err.error?.error || 'Fallo al reiniciar el sistema';
        this.notificationService.show(errMsg, 'error');
      }
    });
  }
}
