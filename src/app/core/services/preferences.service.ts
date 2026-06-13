import { Injectable, signal, effect, inject } from '@angular/core';
import { PreferenceState } from '../models/weather.models';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'weather:preferences';

const defaultPreferences: PreferenceState = {
  temperature: 'c',
  wind: 'kph',
  pressure: 'mb',
  precipitation: 'mm',
  timeFormat: '24h',
  theme: 'auto'
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly storage = inject(StorageService);
  readonly preferences = signal<PreferenceState>(
    this.storage.get<PreferenceState>(STORAGE_KEY, defaultPreferences)
  );

  constructor() {
    effect(() => {
      this.storage.set(STORAGE_KEY, this.preferences());
      this.applyTheme(this.preferences().theme);
    });
  }

  update(patch: Partial<PreferenceState>) {
    this.preferences.update((prev) => ({ ...prev, ...patch }));
  }

  private applyTheme(theme: PreferenceState['theme']) {
    if (typeof document === 'undefined') return;
    let resolved: 'dark' | 'light';
    if (theme === 'auto') {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = theme === 'dark' ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    try {
      localStorage.setItem('aurora-theme', resolved);
    } catch {}
    // clean up any legacy body classes from the old theming mechanism
    document.body.classList.remove('theme-light', 'theme-dark');
  }
}


