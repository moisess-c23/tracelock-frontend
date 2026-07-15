import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSignal = signal<boolean>(true);
  isDarkMode = computed(() => this.isDarkModeSignal());

  constructor() {
    this.initializeTheme();

    effect(() => {
      const isDark = this.isDarkModeSignal();
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.body.classList.remove('light-theme');
        } else {
          document.body.classList.add('light-theme');
        }
      }
    });
  }

  private initializeTheme(): void {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('tracelock_dark_theme');
      if (savedTheme !== null) {
        this.isDarkModeSignal.set(savedTheme === 'true');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkModeSignal.set(prefersDark);
      }
    }
  }

  toggleTheme(): void {
    this.isDarkModeSignal.update(dark => {
      const nextTheme = !dark;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tracelock_dark_theme', String(nextTheme));
      }
      return nextTheme;
    });
  }
}
