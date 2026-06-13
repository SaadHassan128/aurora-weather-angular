import { Component, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { NgChartsModule } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import type { ForecastHour, SavedLocation } from '../../core/models/weather.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, RevealDirective, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bento">
      <div class="card bento-hero" appTilt [appReveal]="0" *ngIf="current() as current">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-label">Current</div>
              <h2 class="mb-0">{{ current.tempC }}°C</h2>
              <div class="text-label">{{ current.condition.text }}</div>
            </div>
            <img
              *ngIf="current.condition.icon"
              [src]="current.condition.icon"
              width="72"
              height="72"
              [alt]="current.condition.text || 'Weather icon'"
            />
          </div>
          <div class="mt-3 row text-center">
            <div class="col">
              <div class="text-label">Feels</div>
              <div class="fw-semibold">{{ current.feelslikeC }}°</div>
            </div>
            <div class="col">
              <div class="text-label">Wind</div>
              <div class="fw-semibold">{{ current.windKph }} kph</div>
            </div>
            <div class="col">
              <div class="text-label">Humidity</div>
              <div class="fw-semibold">{{ current.humidity }}%</div>
            </div>
            <div class="col">
              <div class="text-label">UV</div>
              <div class="fw-semibold">{{ current.uv }}</div>
            </div>
          </div>
      </div>

      <div class="card bento-chart" [appReveal]="1">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="section-title mb-0">
              <i class="bi bi-graph-up"></i>
              <span>Next hours - {{ currentLocationName() }}</span>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <div class="metric-toggle" role="group">
                <button
                  class="btn-outline-accent btn-sm"
                  [class.active]="selectedMetric === 'tempC'"
                  (click)="selectMetric('tempC')"
                >
                  Temp
                </button>
                <button
                  class="btn-outline-accent btn-sm"
                  [class.active]="selectedMetric === 'humidity'"
                  (click)="selectMetric('humidity')"
                >
                  Humidity
                </button>
                <button
                  class="btn-outline-accent btn-sm"
                  [class.active]="selectedMetric === 'windKph'"
                  (click)="selectMetric('windKph')"
                >
                  Wind
                </button>
                <button
                  class="btn-outline-accent btn-sm"
                  [class.active]="selectedMetric === 'precipMm'"
                  (click)="selectMetric('precipMm')"
                >
                  Precip
                </button>
              </div>
              <div class="country-group" style="width: clamp(200px, 45vw, 320px);">
                <span class="country-label">Country</span>
                <input
                  class="country-input"
                  type="text"
                  [value]="countryQuery"
                  (input)="countryQuery = ($any($event.target).value || '').trim()"
                  placeholder="e.g. France"
                />
                <button class="btn-accent btn-sm" (click)="applyCountry()">Go</button>
              </div>
            </div>
          </div>
          <div *ngIf="forecast()?.days?.[0]?.hours?.length; else noData">
            <canvas
              baseChart
              [data]="seriesChartData"
              [options]="chartOptions"
              [type]="'line'"
              height="300"
            ></canvas>
            <div class="d-flex justify-content-around mt-3 pt-2 border-top border-secondary">
              <div class="text-center">
                <div class="text-muted small">Avg</div>
                <div class="fw-bold text-success">{{ avgMetric() }}{{ unitLabel }}</div>
              </div>
              <div class="text-center">
                <div class="text-muted small">High</div>
                <div class="fw-bold text-danger">{{ highMetric() }}{{ unitLabel }}</div>
              </div>
              <div class="text-center">
                <div class="text-muted small">Low</div>
                <div class="fw-bold text-info">{{ lowMetric() }}{{ unitLabel }}</div>
              </div>
            </div>
          </div>
          <ng-template #noData>
            <div class="text-center py-5 text-muted">
              <i class="bi bi-graph-up" style="font-size: 2rem; opacity: 0.5;"></i>
              <div class="mt-2">Loading weather data...</div>
            </div>
          </ng-template>
      </div>

      <div class="card bento-forecast" [appReveal]="2">
          <div class="section-title">
            <i class="bi bi-calendar-week"></i>
            <span>Daily forecast - {{ forecastLocationName() }}</span>
          </div>
          <div class="d-flex flex-nowrap overflow-auto gap-3 pb-2">
            <div
              class="forecast-card text-center"
              *ngFor="let day of forecast()?.days; trackBy: trackByDate"
            >
              <div class="fw-semibold">{{ day.date }}</div>
              <img
                [src]="day.condition.icon"
                width="48"
                height="48"
                [alt]="day.condition.text || 'Weather icon'"
              />
              <div class="fw-bold">{{ day.maxtempC }}° / {{ day.mintempC }}°</div>
              <small class="text-muted">{{ day.condition.text }}</small>
            </div>
          </div>
      </div>

      <div class="card bento-alerts" [appReveal]="3">
          <div class="section-title">
            <i class="bi bi-exclamation-triangle"></i>
            <span>Alerts - {{ forecastLocationName() }}</span>
          </div>
          <div *ngIf="forecast()?.alerts?.length; else noAlerts" class="d-flex flex-column gap-2">
            <div
              class="p-2 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25"
              *ngFor="let alert of forecast()?.alerts"
            >
              <div class="fw-semibold">{{ alert.headline }}</div>
              <small class="text-muted">{{ alert.desc }}</small>
            </div>
          </div>
          <ng-template #noAlerts>
            <div class="text-muted">No active weather alerts.</div>
          </ng-template>
      </div>

      <div class="card bento-saved" [appReveal]="4">
          <div class="section-title">
            <i class="bi bi-bookmarks"></i>
            <span>Saved & History</span>
          </div>
          <div class="mb-3">
            <div class="fw-semibold">Saved</div>
            <div
              *ngFor="let s of locations.saved(); trackBy: trackByName"
              class="d-flex justify-content-between align-items-center small text-muted py-1"
            >
              <div>{{ s.name }}</div>
              <button class="btn btn-sm btn-link" (click)="openSaved(s)">Open</button>
            </div>
            <div *ngIf="!locations.saved().length" class="text-muted small">No saved locations</div>
          </div>
          <div>
            <div class="fw-semibold">Recent searches</div>
            <div
              *ngFor="let r of locations.recent(); trackBy: trackByRecent"
              class="small text-muted py-1"
            >
              {{ r.query }} <small class="text-muted">— {{ r.at | date : 'short' }}</small>
            </div>
            <div *ngIf="!locations.recent().length" class="text-muted small">
              No recent searches
            </div>
          </div>
          <div class="mt-3">
            <div class="fw-semibold">History</div>
            <div *ngFor="let h of locations.history()" class="small text-muted py-1">
              {{ h.type }}: {{ h.query }}
              <small class="text-muted">— {{ h.at | date : 'short' }}</small>
            </div>
            <div *ngIf="!locations.history().length" class="text-muted small">No history yet</div>
          </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bento {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 1rem;
        align-items: start;
      }
      .card {
        padding: 1.25rem;
      }
      .bento-hero {
        grid-column: span 4;
      }
      .bento-chart {
        grid-column: span 8;
      }
      .bento-forecast {
        grid-column: span 8;
      }
      .bento-alerts {
        grid-column: span 4;
      }
      .bento-saved {
        grid-column: span 4;
      }
      .forecast-card {
        min-width: 140px;
        padding: 0.85rem;
        border-radius: 1rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
      }
      .metric-toggle {
        display: inline-flex;
        gap: 0.35rem;
        flex-wrap: wrap;
      }
      .btn-sm {
        padding: 0.3rem 0.7rem;
        font-size: 0.8rem;
        line-height: 1.2;
      }
      .metric-toggle .btn-outline-accent.active {
        background: var(--accent);
        color: var(--accent-contrast);
        border-color: var(--accent);
      }
      .country-group {
        display: inline-flex;
        align-items: stretch;
        border: 1px solid var(--border);
        border-radius: var(--radius-pill, 999px);
        overflow: hidden;
        background: var(--surface-2);
      }
      .country-label {
        display: inline-flex;
        align-items: center;
        padding: 0 0.7rem;
        font-size: 0.8rem;
        color: var(--text-muted);
        background: var(--surface);
        white-space: nowrap;
      }
      .country-input {
        flex: 1 1 auto;
        min-width: 0;
        background: var(--surface-2);
        border: none;
        color: var(--text);
        padding: 0.35rem 0.7rem;
        font-size: 0.85rem;
        outline: none;
      }
      .country-group .btn-accent {
        border-radius: 0;
      }
      @media (max-width: 991px) {
        .bento {
          grid-template-columns: 1fr;
        }
        .bento-hero,
        .bento-chart,
        .bento-forecast,
        .bento-alerts,
        .bento-saved {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly weather = inject(WeatherStateService);
  readonly locations = inject(LocationService);

  readonly current = computed(() => this.weather.currentWeather());
  readonly forecast = computed(() => this.weather.forecast());

  selectedMetric: 'tempC' | 'humidity' | 'windKph' | 'precipMm' = 'tempC';
  countryQuery = '';

  readonly currentLocationName = computed(() => {
    return this.current()?.location?.name || 'Current Location';
  });

  readonly forecastLocationName = computed(() => {
    return this.forecast()?.location?.name || 'Forecast Location';
  });

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleColor: this.cssVar('--accent', '#38bdf8'),
        bodyColor: this.cssVar('--text', '#e8eef6'),
        borderColor: this.cssVar('--accent', '#38bdf8'),
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: this.cssVar('--text-muted', '#9fb3c8'), font: { size: 11, weight: 'bold' } },
        grid: { color: 'rgba(159,179,200,0.12)' },
      },
      y: {
        ticks: { color: this.cssVar('--text-muted', '#9fb3c8'), font: { size: 11, weight: 'bold' } },
        grid: { color: 'rgba(159,179,200,0.12)' },
      },
    },
  };

  private cssVar(name: string, fallback: string): string {
    if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  readonly avgMetric = computed(() => {
    const hours = (this.forecast()?.days?.[0]?.hours ?? []) as ForecastHour[];
    if (!hours.length) return 0;
    const sum = hours.reduce((a: number, h: ForecastHour) => a + this.valueByMetric(h), 0);
    return Math.round((sum / hours.length) * 10) / 10;
  });

  readonly highMetric = computed(() => {
    const hours = (this.forecast()?.days?.[0]?.hours ?? []) as ForecastHour[];
    return Math.max(...hours.map((h: ForecastHour) => this.valueByMetric(h)), 0);
  });

  readonly lowMetric = computed(() => {
    const hours = (this.forecast()?.days?.[0]?.hours ?? []) as ForecastHour[];
    return Math.min(...hours.map((h: ForecastHour) => this.valueByMetric(h)), 0);
  });

  get unitLabel(): string {
    if (this.selectedMetric === 'tempC') return '°C';
    if (this.selectedMetric === 'humidity') return '%';
    if (this.selectedMetric === 'windKph') return ' kph';
    return ' mm';
  }

  get seriesChartData(): ChartConfiguration['data'] {
    const hours = (this.forecast()?.days?.[0]?.hours ?? []) as ForecastHour[];
    const label =
      this.selectedMetric === 'tempC'
        ? 'Temperature (°C)'
        : this.selectedMetric === 'humidity'
        ? 'Humidity (%)'
        : this.selectedMetric === 'windKph'
        ? 'Wind (kph)'
        : 'Precipitation (mm)';
    return {
      labels: hours.map((h: ForecastHour) => {
        const t = String(h.time);
        const timePart = t.includes('T') ? t.split('T')[1] : t.split(' ')[1] ?? t;
        return (timePart ?? '').slice(0, 5);
      }),
      datasets: [
        {
          label,
          data: hours.map((h: ForecastHour) => this.valueByMetric(h)),
          tension: 0.4,
          fill: true,
          borderColor: this.cssVar('--accent', '#38bdf8'),
          backgroundColor: 'rgba(56,189,248,0.12)',
          pointBackgroundColor: this.cssVar('--accent', '#38bdf8'),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }

  selectMetric(metric: 'tempC' | 'humidity' | 'windKph' | 'precipMm') {
    this.selectedMetric = metric;
  }

  applyCountry() {
    if (!this.countryQuery) return;
    this.locations.addRecent(this.countryQuery);
    this.locations.recordAction('view', this.countryQuery);
    this.weather.setLocation(this.countryQuery);
  }

  private valueByMetric(h: ForecastHour): number {
    if (this.selectedMetric === 'tempC') return h.tempC ?? 0;
    if (this.selectedMetric === 'humidity') return h.humidity ?? 0;
    if (this.selectedMetric === 'windKph') return h.windKph ?? 0;
    return h.willItRain ? 1 : 0;
  }

  openSaved(s: SavedLocation) {
    const target = `${s.lat},${s.lon}`;
    this.locations.addRecent(s.name);
    this.locations.recordAction('view', s.name);
    this.weather.setLocation(target);
  }

  ngOnInit(): void {
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
    });
  }

  trackByDate = (_: number, d: any) => d?.date;
  trackByName = (_: number, s: any) => s?.name;
  trackByRecent = (_: number, r: any) => r?.query + '_' + (r?.at ?? '');
}
