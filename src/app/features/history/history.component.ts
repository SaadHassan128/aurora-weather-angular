import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { ForecastDay } from '../../core/models/weather.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row g-3">
      <div class="col-12">
        <div class="glass-card p-4">
          <div class="section-title">
            <i class="bi bi-clock-history"></i>
            <span>Historical Weather Data</span>
          </div>
          <div class="text-muted small">
            Location: <strong>{{ locationName() || 'Current Location' }}</strong> •
            {{ locationCountry() || 'Unknown' }}
          </div>
          <div class="text-muted small mt-2">
            <i class="bi bi-info-circle"></i> Select a date to view historical weather records
          </div>

          <div class="d-flex gap-2 align-items-center mt-4 flex-wrap">
            <label class="form-label mb-0 fw-bold">Select Date:</label>
            <input
              class="form-control form-control-sm"
              style="width: clamp(160px, 50vw, 240px);"
              type="date"
              [formControl]="date"
            />
            <button class="btn btn-sm btn-primary" (click)="load()">
              <i class="bi bi-search"></i> Load
            </button>
            <div class="vr"></div>
            <button
              class="btn btn-sm btn-outline-secondary"
              (click)="loadToday()"
              title="Load today's historical data"
            >
              <i class="bi bi-calendar-today"></i> Today
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              (click)="loadYesterday()"
              title="Load yesterday's historical data"
            >
              <i class="bi bi-calendar-check"></i> Yesterday
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              (click)="loadLast7Days()"
              title="Load average for last 7 days"
            >
              <i class="bi bi-calendar-range"></i> Last 7 Days
            </button>
          </div>
        </div>
      </div>

      <div class="col-12" *ngIf="day">
        <div class="row g-3">
          <div class="col-12 col-lg-6">
            <div class="glass-card p-4">
              <div class="fw-bold mb-3">Temperature</div>
              <div class="row g-2">
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-danger bg-opacity-10 text-center">
                    <div class="text-muted small">High</div>
                    <div class="fs-5 fw-bold text-danger">{{ day.maxtempC }}°C</div>
                    <small class="text-muted"
                      >{{ day.maxtempC * 1.8 + 32 | number : '1.0-0' }}°F</small
                    >
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-info bg-opacity-10 text-center">
                    <div class="text-muted small">Low</div>
                    <div class="fs-5 fw-bold text-info">{{ day.mintempC }}°C</div>
                    <small class="text-muted"
                      >{{ day.mintempC * 1.8 + 32 | number : '1.0-0' }}°F</small
                    >
                  </div>
                </div>
              </div>
              <div class="mt-3 p-3 rounded-3 bg-dark-subtle">
                <div class="text-muted small">Average</div>
                <div class="fw-bold">{{ day.avgtempC | number : '1.1-1' }}°C</div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="glass-card p-4">
              <div class="fw-bold mb-3">Precipitation & Wind</div>
              <div class="row g-2">
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-success bg-opacity-10 text-center">
                    <div class="text-muted small">Rain Chance</div>
                    <div class="fs-5 fw-bold text-success">{{ day.dailyChanceOfRain }}%</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-warning bg-opacity-10 text-center">
                    <div class="text-muted small">Precipitation</div>
                    <div class="fs-5 fw-bold text-warning">
                      {{ day.totalprecipMm | number : '1.1-1' }} mm
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-3 p-3 rounded-3 bg-dark-subtle">
                <div class="text-muted small">Max Wind</div>
                <div class="fw-bold">{{ day.maxwindKph | number : '1.1-1' }} kph</div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="glass-card p-4">
              <div class="fw-bold mb-3">Humidity & UV</div>
              <div class="row g-2">
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-info bg-opacity-10 text-center">
                    <div class="text-muted small">Humidity</div>
                    <div class="fs-5 fw-bold text-info">
                      {{ day.avghumidity | number : '1.0-0' }}%
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 rounded-3 bg-warning bg-opacity-10 text-center">
                    <div class="text-muted small">UV Index</div>
                    <div class="fs-5 fw-bold text-warning">{{ day.uv | number : '1.1-1' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="glass-card p-4">
              <div class="fw-bold mb-3">Date Info</div>
              <div class="p-3 rounded-3 bg-dark-subtle mb-2">
                <div class="text-muted small">Date</div>
                <div class="fw-bold">{{ day.date }}</div>
              </div>
              <div *ngIf="day.sunrise" class="p-3 rounded-3 bg-dark-subtle">
                <div class="d-flex justify-content-between">
                  <div>
                    <div class="text-muted small">Sunrise</div>
                    <div class="fw-bold">{{ day.sunrise }}</div>
                  </div>
                  <div>
                    <div class="text-muted small">Sunset</div>
                    <div class="fw-bold">{{ day.sunset }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12" *ngIf="!day">
        <div class="glass-card p-5 text-center">
          <i class="bi bi-calendar2-blank text-muted" style="font-size: 3rem;"></i>
          <div class="text-muted mt-3">
            Select a date and click "Load" to view historical weather data
          </div>
        </div>
      </div>

      <div class="col-12" *ngIf="isLoading">
        <div class="glass-card p-4 text-center">
          <div class="spinner-border spinner-border-sm text-info" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div class="text-muted mt-2">Loading historical data...</div>
        </div>
      </div>

      <div class="col-12" *ngIf="error">
        <div class="alert alert-warning mb-0">
          <i class="bi bi-exclamation-triangle"></i> {{ error }}
        </div>
      </div>
    </div>
  `,
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
