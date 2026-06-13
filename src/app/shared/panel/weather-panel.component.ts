import { Component, HostListener, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
    <button
      class="panel-trigger"
      type="button"
      aria-label="Open weather panel"
      (click)="toggle()"
    >
      <i class="bi bi-cloud-sun-fill"></i>
      <span class="ms-2">{{ weather.currentWeather()?.tempC ?? '--' }}°</span>
    </button>

    <div class="backdrop" *ngIf="open()" (click)="close()"></div>
    <aside
      class="panel"
      role="dialog"
      aria-label="Weather panel"
      [attr.aria-modal]="open() ? 'true' : null"
      [ngClass]="{ open: open() }"
    >
      <header class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div class="fw-bold">Weather Panel</div>
          <small class="text-muted">Quick access anywhere</small>
        </div>
        <button class="icon-btn" type="button" aria-label="Close panel" (click)="close()">
          <i class="bi bi-x-lg"></i>
        </button>
      </header>

      <div class="mini-widget" *ngIf="weather.currentWeather() as current">
        <div class="d-flex align-items-center gap-3">
          <img
            [src]="current.condition.icon"
            width="52"
            height="52"
            loading="lazy"
            [alt]="current.condition.text || 'Weather icon'"
          />
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
            class="saved-row d-flex justify-content-between align-items-center"
          >
            <div>
              <div class="fw-semibold">{{ loc.name }}</div>
              <small class="text-muted">{{ loc.country }}</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn-outline-accent btn-sm" type="button" (click)="switch(loc.name)">
                Switch
              </button>
              <button
                class="btn-outline-accent btn-sm"
                type="button"
                [disabled]="loc.default"
                (click)="makeDefault(loc.name)"
              >
                Default
              </button>
            </div>
          </div>
          <div class="text-muted small" *ngIf="!locations.saved().length">
            No saved locations yet.
          </div>
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
            class="pill"
            type="button"
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
          <button class="btn-outline-accent btn-sm" type="button" (click)="toggleTemp()">
            °C / °F
          </button>
          <button class="btn-outline-accent btn-sm" type="button" (click)="toggleTheme()">
            Theme
          </button>
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
        display: inline-flex;
        align-items: center;
        background: var(--accent);
        color: var(--accent-contrast);
        border: none;
        padding: 11px 22px;
        font-weight: 700;
        border-radius: var(--radius-pill);
        box-shadow: var(--shadow);
        transition: transform 0.25s, background 0.25s;
      }
      .panel-trigger:hover {
        background: var(--accent-hover);
        color: var(--accent-contrast);
        transform: translateY(-2px);
      }
      .panel {
        position: fixed;
        top: 0;
        left: -360px;
        width: 320px;
        height: 100vh;
        padding: 1.25rem;
        background: var(--surface);
        border-right: 1px solid var(--border);
        box-shadow: var(--shadow);
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
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1045;
      }
      .mini-widget {
        padding: 1rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
      }
      .saved-row {
        padding: 0.5rem 0.75rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
      }
      .btn-sm {
        padding: 0.3rem 0.85rem;
        font-size: 0.85rem;
      }
      .pill {
        border: 1px solid var(--border);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: var(--surface-2);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        transition: border-color 0.2s, color 0.2s;
      }
      .icon-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      .panel-trigger:focus-visible,
      .icon-btn:focus-visible,
      .pill:focus-visible,
      .btn-outline-accent:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
