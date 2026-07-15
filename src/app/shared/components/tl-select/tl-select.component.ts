import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  HostListener,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';

export interface TlSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'tl-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tls-root" [class.tls-open]="isOpen()" [class.tls-disabled]="disabled">
      <button
        type="button"
        class="tls-trigger"
        [disabled]="disabled"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
      >
        <span class="tls-value" [class.tls-placeholder]="!value">
          {{ selectedLabel }}
        </span>
        <svg class="tls-chevron" xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      @if (isOpen()) {
        <div class="tls-panel">
          <button
            type="button"
            class="tls-option tls-option-placeholder"
            (click)="select('')"
          >{{ placeholder }}</button>

          @for (opt of options; track opt.value) {
            <button
              type="button"
              class="tls-option"
              [class.tls-selected]="opt.value === value"
              (click)="select(opt.value)"
            >
              @if (opt.value === value) {
                <svg class="tls-check" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else {
                <span class="tls-check-placeholder"></span>
              }
              {{ opt.label }}
            </button>
          }

          @if (options.length === 0 && emptyMessage) {
            <div class="tls-empty">{{ emptyMessage }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; width: 100%; }

    .tls-root { position: relative; width: 100%; }

    .tls-disabled { opacity: 0.4; pointer-events: none; }

    .tls-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.6rem 0.875rem;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 8px;
      color: var(--input-color);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;

      &:hover:not([disabled]) {
        border-color: var(--border-hover);
        background: var(--input-focus-bg);
      }

      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }

    .tls-open .tls-trigger {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-dim);
      background: var(--input-focus-bg);
    }

    .tls-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tls-placeholder { color: var(--input-placeholder); }

    .tls-chevron {
      width: 15px;
      height: 15px;
      color: var(--text-muted);
      flex-shrink: 0;
      transition: transform 0.18s ease;
    }

    .tls-open .tls-chevron { transform: rotate(180deg); }

    .tls-panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
      max-height: 240px;
      overflow-y: auto;
      animation: panel-drop 0.15s cubic-bezier(0.4,0,0.2,1) both;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: var(--border-hover);
        border-radius: 4px;
      }
    }

    @keyframes panel-drop {
      from { opacity: 0; transform: translateY(-6px) scaleY(0.95); }
      to   { opacity: 1; transform: translateY(0)   scaleY(1); }
    }

    .tls-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.875rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-size: 0.82rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease, color 0.1s ease;

      &:hover { background: var(--bg-card-hover); color: var(--text-main); }
    }

    .tls-option-placeholder {
      color: var(--text-muted);
      font-size: 0.78rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.6rem;
      margin-bottom: 2px;

      &:hover { background: var(--bg-card-hover); color: var(--text-secondary); }
    }

    .tls-selected {
      color: var(--color-primary-light) !important;
      background: var(--color-primary-dim) !important;
      font-weight: 600;
    }

    .tls-check {
      width: 13px;
      height: 13px;
      color: var(--color-primary-light);
      flex-shrink: 0;
    }

    .tls-check-placeholder {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }

    .tls-empty {
      padding: 1rem 0.875rem;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 0.78rem;
      text-align: center;
    }
  `],
})
export class TlSelectComponent {
  private elRef = inject(ElementRef);

  @Input() options: TlSelectOption[] = [];
  @Input() value   = '';
  @Input() placeholder = 'Seleccionar…';
  @Input() disabled    = false;
  @Input() emptyMessage = '';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);

  get selectedLabel(): string {
    const found = this.options.find(o => o.value === this.value);
    return found ? found.label : this.placeholder;
  }

  toggle(): void {
    if (!this.disabled) this.isOpen.update(v => !v);
  }

  select(val: string): void {
    this.valueChange.emit(val);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.isOpen.set(false); }
}
