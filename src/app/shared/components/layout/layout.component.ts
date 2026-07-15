import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { NotificationService } from '../../../core/services/notification.service';
import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0 }),
      animate('80ms ease', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  animations: [routeAnimation],
  template: `
    <div class="app-layout-grid">
      <app-sidebar></app-sidebar>

      <div class="main-content-pane">
        <app-header></app-header>

        <main class="page-viewport" [@routeAnimation]="getRouteState(outlet)">
          <router-outlet #outlet="outlet"></router-outlet>
        </main>
      </div>

      <div class="toast-container">
        @for (toast of toasts(); track toast.id) {
          <div [class]="'toast toast-' + toast.type" (click)="removeToast(toast.id)">
            <div class="toast-indicator"></div>
            <div class="toast-content">
              @switch (toast.type) {
                @case ('success') {
                  <svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                @case ('warning') {
                  <svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                @case ('error') {
                  <svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                @default {
                  <svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              }
              <span class="toast-text">{{ toast.message }}</span>
            </div>
            <button class="toast-close-btn">&times;</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .app-layout-grid {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background: var(--bg-main);
      position: relative;
    }

    .main-content-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .page-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
      position: relative;

      > * {
        position: relative;
        will-change: opacity, transform;
      }
    }

    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      min-width: 300px;
      max-width: 400px;
      background: var(--bg-surface);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.60), 0 0 0 1px rgba(255, 255, 255, 0.05);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      animation: toast-slide-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--border-hover);
        transform: translateY(-2px);
      }
    }

    @keyframes toast-slide-in {
      from { transform: translateX(120%) scale(0.95); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }

    .toast-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .toast-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .toast-text {
      font-size: 0.82rem;
      color: var(--text-main);
      font-family: var(--font-sans);
      font-weight: 500;
      line-height: 1.35;
    }

    .toast-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
      padding-left: 0.5rem;
      display: flex;
      align-items: center;
      
      &:hover {
        color: var(--text-secondary);
      }
    }

    .toast-success {
      border-left: 1px solid rgba(0, 200, 150, 0.30);
      .toast-indicator { background: var(--color-in-route); box-shadow: var(--glow-green); }
      .toast-icon { color: var(--color-in-route); }
    }
    .toast-warning {
      border-left: 1px solid rgba(245, 166, 35, 0.30);
      .toast-indicator { background: var(--color-idle); box-shadow: var(--glow-amber); }
      .toast-icon { color: var(--color-idle); }
    }
    .toast-error {
      border-left: 1px solid rgba(240, 67, 101, 0.30);
      .toast-indicator { background: var(--color-stopped); box-shadow: var(--glow-red); }
      .toast-icon { color: var(--color-stopped); }
    }
    .toast-info {
      border-left: 1px solid rgba(37, 99, 255, 0.30);
      .toast-indicator { background: var(--color-primary); box-shadow: var(--glow-primary); }
      .toast-icon { color: var(--color-primary-light); }
    }
  `]
})
export class LayoutComponent {
  private notificationService = inject(NotificationService);

  toasts = computed(() => this.notificationService.toasts());

  removeToast(id: string) {
    this.notificationService.remove(id);
  }

  getRouteState(outlet: RouterOutlet): string {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.url[0]?.path ?? 'home' : 'none';
  }
}
