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
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(isDark ? 'theme-dark' : 'theme-light');
      return;
    }
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  }
}


