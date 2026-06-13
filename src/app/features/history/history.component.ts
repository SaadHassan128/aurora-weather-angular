import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ForecastDay } from '../../core/models/weather.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="history-stack">
      <!-- Date picker bar -->
      <div class="card">
        <h2 class="section-title">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          <span>Historical Weather Data</span>
        </h2>
        <div class="text-label">
          Location: {{ locationName() || 'Current Location' }} &middot;
          {{ locationCountry() || 'Unknown' }}
        </div>
        <div class="text-label mt-1">
          <i class="bi bi-info-circle"></i> Select a date to view historical weather records
        </div>

        <div class="picker-bar">
          <label class="text-label picker-label" for="history-date">Select Date</label>
          <input id="history-date" class="date-input" type="date" [formControl]="date" />
          <button type="button" class="btn-accent" (click)="load()">
            <i class="bi bi-search"></i> Load
          </button>
          <span class="picker-divider" aria-hidden="true"></span>
          <button
            type="button"
            class="btn-outline-accent btn-sm"
            (click)="loadToday()"
            title="Load today's historical data"
          >
            <i class="bi bi-calendar-today"></i> Today
          </button>
          <button
            type="button"
            class="btn-outline-accent btn-sm"
            (click)="loadYesterday()"
            title="Load yesterday's historical data"
          >
            <i class="bi bi-calendar-check"></i> Yesterday
          </button>
          <button
            type="button"
            class="btn-outline-accent btn-sm"
            (click)="loadLast7Days()"
            title="Load average for last 7 days"
          >
            <i class="bi bi-calendar-range"></i> Last 7 Days
          </button>
        </div>
      </div>

      <!-- Content: stat bento -->
      <div class="stat-bento" *ngIf="day">
        <div class="card" appReveal [appReveal]="0">
          <div class="section-title sm">Temperature</div>
          <div class="tile-row">
            <div class="tile tint-danger">
              <div class="text-label">High</div>
              <div class="tile-value">{{ day.maxtempC }}°C</div>
              <div class="text-label">{{ day.maxtempC * 1.8 + 32 | number : '1.0-0' }}°F</div>
            </div>
            <div class="tile tint-accent">
              <div class="text-label">Low</div>
              <div class="tile-value">{{ day.mintempC }}°C</div>
              <div class="text-label">{{ day.mintempC * 1.8 + 32 | number : '1.0-0' }}°F</div>
            </div>
          </div>
          <div class="tile tint-neutral">
            <div class="text-label">Average</div>
            <div class="tile-value">{{ day.avgtempC | number : '1.1-1' }}°C</div>
          </div>
        </div>

        <div class="card" appReveal [appReveal]="1">
          <div class="section-title sm">Precipitation &amp; Wind</div>
          <div class="tile-row">
            <div class="tile tint-success">
              <div class="text-label">Rain Chance</div>
              <div class="tile-value">{{ day.dailyChanceOfRain }}%</div>
            </div>
            <div class="tile tint-warning">
              <div class="text-label">Precipitation</div>
              <div class="tile-value">{{ day.totalprecipMm | number : '1.1-1' }} mm</div>
            </div>
          </div>
          <div class="tile tint-neutral">
            <div class="text-label">Max Wind</div>
            <div class="tile-value">{{ day.maxwindKph | number : '1.1-1' }} kph</div>
          </div>
        </div>

        <div class="card" appReveal [appReveal]="2">
          <div class="section-title sm">Humidity &amp; UV</div>
          <div class="tile-row">
            <div class="tile tint-accent">
              <div class="text-label">Humidity</div>
              <div class="tile-value">{{ day.avghumidity | number : '1.0-0' }}%</div>
            </div>
            <div class="tile tint-warning">
              <div class="text-label">UV Index</div>
              <div class="tile-value">{{ day.uv | number : '1.1-1' }}</div>
            </div>
          </div>
        </div>

        <div class="card" appReveal [appReveal]="3">
          <div class="section-title sm">Date Info</div>
          <div class="tile tint-neutral">
            <div class="text-label">Date</div>
            <div class="tile-value">{{ day.date }}</div>
          </div>
          <div *ngIf="day.sunrise" class="tile tint-neutral mt-2">
            <div class="sun-row">
              <div>
                <div class="text-label">Sunrise</div>
                <div class="tile-value">{{ day.sunrise }}</div>
              </div>
              <div>
                <div class="text-label">Sunset</div>
                <div class="tile-value">{{ day.sunset }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="card empty-card" *ngIf="!day">
        <i class="bi bi-calendar2-blank"></i>
        <div class="text-label">
          Select a date and click "Load" to view historical weather data
        </div>
      </div>

      <!-- Loading skeleton -->
      <div class="card" *ngIf="isLoading" aria-busy="true" aria-live="polite">
        <div class="section-title sm">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          <span>Loading historical data…</span>
        </div>
        <div class="tile-row" aria-hidden="true">
          <div class="tile skeleton"></div>
          <div class="tile skeleton"></div>
        </div>
        <div class="tile skeleton mt-2" aria-hidden="true"></div>
      </div>

      <!-- Error state -->
      <div class="card error-card" *ngIf="error" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .history-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .section-title.sm {
        font-size: 1rem;
      }

      .picker-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.6rem;
        margin-top: 1.25rem;
      }

      .picker-label {
        margin: 0;
        font-weight: 600;
      }

      .date-input {
        width: clamp(160px, 50vw, 240px);
        padding: 0.4rem 0.65rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: 10px;
        font: inherit;
      }

      .date-input:focus {
        outline: none;
        border-color: var(--accent);
      }

      .picker-divider {
        width: 1px;
        align-self: stretch;
        min-height: 1.75rem;
        background: var(--border);
        margin: 0 0.25rem;
      }

      .stat-bento {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }

      .tile-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
      }

      .tile {
        padding: 0.85rem;
        border-radius: 14px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        text-align: center;
      }

      .tile.mt-2 {
        margin-top: 0.6rem;
      }

      .tile-value {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text);
      }

      .tint-neutral {
        background: var(--surface-2);
      }

      .tint-danger {
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border-color: color-mix(in srgb, var(--danger) 28%, var(--border));
      }
      .tint-danger .tile-value {
        color: var(--danger);
      }

      .tint-accent {
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        border-color: color-mix(in srgb, var(--accent) 28%, var(--border));
      }
      .tint-accent .tile-value {
        color: var(--accent);
      }

      .tint-success {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        border-color: color-mix(in srgb, var(--success) 28%, var(--border));
      }
      .tint-success .tile-value {
        color: var(--success);
      }

      .tint-warning {
        background: color-mix(in srgb, var(--warning) 12%, transparent);
        border-color: color-mix(in srgb, var(--warning) 28%, var(--border));
      }
      .tint-warning .tile-value {
        color: var(--warning);
      }

      .sun-row {
        display: flex;
        justify-content: space-between;
        text-align: left;
        gap: 1rem;
      }

      .tile.skeleton {
        min-height: 80px;
        border: none;
      }

      .empty-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        text-align: center;
        padding: 2.5rem 1.5rem;
      }

      .empty-card i {
        font-size: 2.75rem;
        color: var(--accent);
      }

      .error-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-color: color-mix(in srgb, var(--danger) 40%, var(--border));
        background: color-mix(in srgb, var(--danger) 8%, transparent);
        color: var(--danger);
      }
    `,
  ],
})
export class HistoryComponent {
  private readonly api = inject(WeatherApiService);
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);

  date = new FormControl<string>('');
  day: ForecastDay | null = null;
  isLoading = false;
  error = '';

  readonly lastSavedName = () => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.name || this.locations.saved()[0]?.name;
  };

  readonly lastSavedCountry = () => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.country || this.locations.saved()[0]?.country;
  };

  readonly locationName = () => {
    const state = this.state.forecast();
    if (state?.location?.name) return state.location.name;
    return this.lastSavedName();
  };

  readonly locationCountry = () => {
    const state = this.state.forecast();
    if (state?.location?.country) return state.location.country;
    return this.lastSavedCountry();
  };

  load() {
    const d = this.date.value;
    if (!d) {
      this.error = 'Please select a date';
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.day = null;
    this.api.getHistory(this.state.currentLocation(), d).subscribe({
      next: (res) => {
        this.day = res;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load historical data. Please try another date.';
        this.isLoading = false;
      },
    });
  }

  loadToday() {
    const today = new Date().toISOString().split('T')[0];
    this.date.setValue(today);
    this.load();
  }

  loadYesterday() {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    this.date.setValue(yesterday);
    this.load();
  }

  loadLast7Days() {
    const last7daysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    this.date.setValue(last7daysAgo);
    this.load();
  }
}
