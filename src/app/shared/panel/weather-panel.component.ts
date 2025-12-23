import { Component, HostListener, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { SavedLocation } from '../../core/models/weather.models';

@Component({
  selector: 'app-weather-panel',
  standalone: true,
  imports: [NgClass, NgIf, NgFor],
  template: `
    <button class="panel-trigger btn btn-primary shadow" (click)="toggle()">
      <i class="bi bi-cloud-sun-fill"></i>
      <span class="ms-2">{{ weather.currentWeather()?.tempC ?? '--' }}°</span>
    </button>

    <div class="backdrop" *ngIf="open()" (click)="close()"></div>
    <aside class="panel glass-card" [ngClass]="{ open: open() }">
      <header class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div class="fw-bold">Weather Panel</div>
          <small class="text-muted">Quick access anywhere</small>
        </div>
        <button class="btn btn-sm btn-outline-light" (click)="close()">
          <i class="bi bi-x-lg"></i>
        </button>
      </header>

      <div class="mini-widget" *ngIf="weather.currentWeather() as current">
        <div class="d-flex align-items-center gap-3">
          <img [src]="current.condition.icon" width="52" height="52" alt="icon" />
          <div>
            <div class="fs-4 fw-bold">{{ current.tempC }}°C</div>
            <div class="text-muted">{{ current.condition.text }}</div>
            <div class="small text-muted">Feels {{ current.feelslikeC }}°C</div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="section-title">
          <i class="bi bi-bookmark-heart"></i>
          <span>Saved locations</span>
        </div>
        <div class="d-flex flex-column gap-2">
          <div
            *ngFor="let loc of locations.saved()"
            class="d-flex justify-content-between align-items-center p-2 rounded-3 bg-dark"
          >
            <div>
              <div class="fw-semibold">{{ loc.name }}</div>
              <small class="text-muted">{{ loc.country }}</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-info" (click)="switch(loc.name)">Switch</button>
              <button
                class="btn btn-sm btn-outline-warning"
                [disabled]="loc.default"
                (click)="makeDefault(loc.name)"
              >
                Default
              </button>
            </div>
          </div>
          <div class="text-muted small" *ngIf="!locations.saved().length">No saved locations yet.</div>
        </div>
      </div>

      <div class="mt-4">
        <div class="section-title">
          <i class="bi bi-clock-history"></i>
          <span>Recent searches</span>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            *ngFor="let recent of locations.recent()"
            class="btn btn-sm btn-outline-light"
            (click)="switchByQuery(recent.query)"
          >
            {{ recent.query }}
          </button>
        </div>
      </div>

      <div class="mt-4">
        <div class="section-title">
          <i class="bi bi-gear"></i>
          <span>Quick prefs</span>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-sm btn-outline-light" (click)="toggleTemp()">°C / °F</button>
          <button class="btn btn-sm btn-outline-light" (click)="toggleTheme()">Theme</button>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .panel-trigger {
        position: fixed;
        left: 1rem;
        bottom: 1rem;
        z-index: 1040;
        border-radius: 999px;
      }
      .panel {
        position: fixed;
        top: 0;
        left: -360px;
        width: 320px;
        height: 100vh;
        padding: 1.25rem;
        transition: transform 0.35s ease, left 0.35s ease;
        overflow-y: auto;
        z-index: 1050;
      }
      .panel.open {
        left: 0;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(4px);
        z-index: 1045;
      }
      .mini-widget {
        padding: 1rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
      }
      @media (max-width: 768px) {
        .panel {
          width: 100%;
          left: -100%;
        }
        .panel.open {
          left: 0;
        }
        .panel-trigger {
          left: 50%;
          transform: translateX(-50%);
        }
      }
    `
  ]
})
export class WeatherPanelComponent {
  readonly open = signal(false);
  readonly weather = inject(WeatherStateService);
  readonly locations = inject(LocationService);
  private readonly preferences = inject(PreferencesService);

  toggle() {
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }

  switch(loc: SavedLocation | string) {
    if (typeof loc === 'string') {
      this.weather.setLocation(loc);
    } else {
      const coords = loc.lat != null && loc.lon != null ? `${loc.lat},${loc.lon}` : loc.name;
      this.weather.setLocation(coords);
    }
    this.close();
  }

  switchByQuery(query: string) {
    this.weather.setLocation(query);
    this.close();
  }

  makeDefault(name: string) {
    this.locations.setDefault(name);
  }

  toggleTemp() {
    const next = this.preferences.preferences().temperature === 'c' ? 'f' : 'c';
    this.preferences.update({ temperature: next });
  }

  toggleTheme() {
    const next = this.preferences.preferences().theme === 'dark' ? 'light' : 'dark';
    this.preferences.update({ theme: next });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }
}

