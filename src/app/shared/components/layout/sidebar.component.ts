import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">

      <button class="hamburger-btn" (click)="toggle()" [title]="collapsed() ? 'Expandir menú' : 'Contraer menú'">
        <span class="hb-line hb-top"></span>
        <span class="hb-line hb-mid"></span>
        <span class="hb-line hb-bot"></span>
      </button>

      <div class="brand">
        <div class="logo-box">
          <svg class="logo-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div class="brand-text">
          <h1>Trace<span>Lock</span></h1>
          <span class="subtitle">Inteligencia de Flota</span>
        </div>
      </div>

      <div class="nav-section">
        <p class="nav-group-label">Plataforma</p>
        <nav class="nav-menu">

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span class="nav-label">Centro Control</span>
            <span class="nav-tooltip">Centro Control</span>
          </a>

          <a routerLink="/fleet" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-3a4 4 0 00-4-4h-4M13 16h-6m8 0h3m-8 0v-4h-4v4m4-4h4" />
              </svg>
            </div>
            <span class="nav-label">Gestión Flota</span>
            <span class="nav-tooltip">Gestión Flota</span>
          </a>

          <a routerLink="/geofences" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span class="nav-label">Geocercas</span>
            <span class="nav-tooltip">Geocercas</span>
          </a>

          <a routerLink="/alerts" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="nav-label">Auditoría Log</span>
            <span class="nav-tooltip">Auditoría Log</span>
          </a>

          <a routerLink="/history" routerLinkActive="active" class="nav-item">
            <div class="nav-icon-wrap">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="nav-label">Time Travel</span>
            <span class="nav-tooltip">Time Travel</span>
          </a>

        </nav>
      </div>

      <div class="sidebar-footer">
        <span class="status-dot" [class.offline]="!alertService.isConnected()"></span>
        <span class="status-label" [class.offline]="!alertService.isConnected()">
          Sistema
          @if (alertService.isConnected()) {
            <strong>En Línea</strong>
          } @else {
            <strong>Sin Conexión</strong>
          }
        </span>
      </div>

    </aside>
  `,
  styles: [`
    :host { display: contents; }

    .sidebar {
      background: var(--bg-panel);
      border-right: 1px solid var(--border-color);
      width: 252px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      z-index: 10;
      overflow: hidden;
      box-shadow: 1px 0 0 var(--border-color), 4px 0 24px rgba(0,0,0,0.18);
      transition: width 0.30s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hamburger-btn {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 5px;
      padding: 1rem 1.25rem;
      border: none;
      background: transparent;
      cursor: pointer;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color);
      width: 100%;
      transition: background var(--transition-fast), padding 0.30s ease;

      &:hover { background: rgba(255,255,255,0.03); }
    }

    .hb-line {
      display: block;
      height: 1.5px;
      border-radius: 2px;
      background: var(--text-secondary);
      transition: all 0.30s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hb-top { width: 20px; }
    .hb-mid { width: 14px; }
    .hb-bot { width: 20px; }

    .collapsed {
      width: 64px;
      overflow: visible;

      .hamburger-btn {
        align-items: center;
        padding: 1rem 0;
      }

      .hb-top {
        width: 16px;
        transform: translateY(6.5px) rotate(45deg);
      }
      .hb-mid {
        width: 16px;
        opacity: 0;
        transform: scaleX(0);
      }
      .hb-bot {
        width: 16px;
        transform: translateY(-6.5px) rotate(-45deg);
      }

      .brand { padding: 1rem 0; justify-content: center; gap: 0; }
      .brand-text { opacity: 0; max-width: 0; pointer-events: none; }
      .nav-group-label { opacity: 0; max-height: 0; margin: 0; overflow: hidden; }
      .nav-section { padding: 1rem 0 0.5rem; }
      .nav-item {
        justify-content: center;
        padding: 0.65rem 0;
        gap: 0;
        margin: 0 0.5rem;
      }
      .nav-label { opacity: 0; max-width: 0; overflow: hidden; pointer-events: none; }
      .nav-tooltip { display: flex; }
      .sidebar-footer { justify-content: center; padding: 1rem 0; }
      .status-label { opacity: 0; max-width: 0; overflow: hidden; pointer-events: none; }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      overflow: hidden;
      transition: padding 0.30s ease, gap 0.30s ease;
    }

    .logo-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 4px 16px rgba(59,130,246,0.40);
      flex-shrink: 0;
    }

    .logo-svg { width: 20px; height: 20px; }

    .brand-text {
      overflow: hidden;
      white-space: nowrap;
      transition: opacity 0.20s ease, max-width 0.30s ease;
      max-width: 160px;

      h1 {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--text-main);
        line-height: 1.1;
        span { color: var(--color-primary-light); }
      }

      .subtitle {
        font-size: 0.60rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        display: block;
        margin-top: 3px;
      }
    }

    .nav-section {
      flex: 1;
      padding: 1rem 0.875rem 0.5rem;
      overflow-y: auto;
      overflow-x: visible; // permite que tooltip salga a la derecha
      transition: padding 0.30s ease;
    }

    .nav-group-label {
      font-size: 0.60rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      padding: 0 0.5rem;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      transition: opacity 0.20s ease, max-height 0.30s ease;
      max-height: 20px;
      overflow: hidden;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.875rem;
      border-radius: 9px;
      color: var(--text-secondary);
      font-size: 0.84rem;
      font-weight: 500;
      text-decoration: none;
      border: 1px solid transparent;
      position: relative;
      overflow: visible;
      transition: background var(--transition-fast), color var(--transition-fast),
                  border-color var(--transition-fast), padding 0.30s ease,
                  gap 0.30s ease, justify-content 0s;

      &:hover {
        background: rgba(255,255,255,0.04);
        color: var(--text-main);
        border-color: var(--border-color);
        .nav-icon-wrap { background: rgba(255,255,255,0.06); }
        .nav-icon { color: var(--text-main); }
        .nav-tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }
      }

      &.active {
        background: var(--color-primary-dim);
        border-color: var(--color-primary-border);
        color: var(--color-primary-light);
        font-weight: 600;
        .nav-icon-wrap { background: rgba(59,130,246,0.15); }
        .nav-icon { color: var(--color-primary-light); }
      }
    }

    .nav-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.03);
      flex-shrink: 0;
      transition: var(--transition-fast);
    }

    .nav-icon {
      width: 17px;
      height: 17px;
      color: var(--text-muted);
      transition: var(--transition-fast);
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.20s ease, max-width 0.30s ease;
      max-width: 160px;
    }

    .nav-tooltip {
      display: none;
      position: absolute;
      left: calc(100% + 14px);
      top: 50%;
      transform: translateY(-50%) translateX(-4px);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.4rem 0.875rem;
      font-size: 0.80rem;
      font-weight: 500;
      color: var(--text-main);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.05);
      z-index: 200;
      align-items: center;

      &::before {
        content: '';
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-right-color: var(--border-color);
      }
      &::after {
        content: '';
        position: absolute;
        right: calc(100% - 1px);
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-right-color: var(--bg-surface);
      }
    }

    .sidebar-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow: hidden; // clip status-label durante transición
      transition: padding 0.30s ease, justify-content 0s;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-in-route);
      box-shadow: 0 0 8px var(--color-in-route);
      flex-shrink: 0;
      animation: pulse-dot 2.5s infinite ease-in-out;
      transition: background 0.4s ease, box-shadow 0.4s ease;

      &.offline {
        background: var(--color-stopped);
        box-shadow: 0 0 8px var(--color-stopped);
        animation: pulse-dot-offline 2.5s infinite ease-in-out;
      }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; box-shadow: 0 0 5px var(--color-in-route); }
      50%       { opacity: 0.65; box-shadow: 0 0 10px var(--color-in-route); }
    }

    @keyframes pulse-dot-offline {
      0%, 100% { opacity: 1; box-shadow: 0 0 5px var(--color-stopped); }
      50%       { opacity: 0.65; box-shadow: 0 0 10px var(--color-stopped); }
    }

    .status-label {
      font-size: 0.70rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.20s ease, max-width 0.30s ease;
      max-width: 160px;
      strong { color: var(--color-in-route); font-weight: 600; }

      &.offline strong { color: var(--color-stopped); }
    }
  `]
})
export class SidebarComponent {
  alertService = inject(AlertService);
  collapsed = signal<boolean>(
    localStorage.getItem('sidebar_collapsed') === 'true'
  );

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  }
}
