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
          <div class="hero-glow" aria-hidden="true"></div>
          <div class="hero-top">
            <div>
              <div class="text-label">Now · {{ currentLocationName() }}</div>
              <div class="hero-temp">
                {{ current.tempC | number : '1.0-0' }}<span class="deg">°C</span>
              </div>
              <div class="hero-cond">{{ current.condition.text }}</div>
              <div class="hero-feels text-muted">Feels like {{ current.feelslikeC | number : '1.0-0' }}°</div>
            </div>
            <i class="bi {{ glyph(current.condition.text, current.isDay) }} hero-icon" aria-hidden="true"></i>
          </div>
          <div class="hero-metrics">
            <div class="metric-chip">
              <i class="bi bi-wind" aria-hidden="true"></i>
              <div>
                <div class="metric-chip-label">Wind</div>
                <div class="metric-chip-value">{{ current.windKph | number : '1.0-0' }} kph</div>
              </div>
            </div>
            <div class="metric-chip">
              <i class="bi bi-droplet-half" aria-hidden="true"></i>
              <div>
                <div class="metric-chip-label">Humidity</div>
                <div class="metric-chip-value">{{ current.humidity }}%</div>
              </div>
            </div>
            <div class="metric-chip">
              <i class="bi bi-brightness-high" aria-hidden="true"></i>
              <div>
                <div class="metric-chip-label">UV index</div>
                <div class="metric-chip-value">{{ current.uv }}</div>
              </div>
            </div>
            <div class="metric-chip">
              <i class="bi bi-eye" aria-hidden="true"></i>
              <div>
                <div class="metric-chip-label">Visibility</div>
                <div class="metric-chip-value">{{ current.visKm | number : '1.0-0' }} km</div>
              </div>
            </div>
          </div>
      </div>

      <div class="card bento-chart" [appReveal]="1">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <h2 class="section-title mb-0">
              <i class="bi bi-graph-up" aria-hidden="true"></i>
              <span>Next hours - {{ currentLocationName() }}</span>
            </h2>
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
            <div class="chart-shell">
              <canvas
                baseChart
                role="img"
                [attr.aria-label]="
                  'Line chart of ' + chartMetricLabel() + ' over the next hours'
                "
                [data]="seriesChartData"
                [options]="chartOptions"
                [type]="'line'"
              ></canvas>
            </div>
            <div class="d-flex justify-content-around mt-3 pt-2 stat-divider">
              <div class="text-center">
                <div class="text-muted small">Avg</div>
                <div class="fw-bold stat-success">{{ avgMetric() }}{{ unitLabel }}</div>
              </div>
              <div class="text-center">
                <div class="text-muted small">High</div>
                <div class="fw-bold stat-danger">{{ highMetric() }}{{ unitLabel }}</div>
              </div>
              <div class="text-center">
                <div class="text-muted small">Low</div>
                <div class="fw-bold stat-accent">{{ lowMetric() }}{{ unitLabel }}</div>
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
          <h2 class="section-title">
            <i class="bi bi-calendar-week" aria-hidden="true"></i>
            <span>Daily forecast - {{ forecastLocationName() }}</span>
          </h2>
          <div class="forecast-strip">
            <div
              class="forecast-card"
              *ngFor="let day of forecast()?.days; trackBy: trackByDate"
            >
              <div class="forecast-day">{{ day.date | date : 'EEE' }}</div>
              <div class="forecast-date text-muted">{{ day.date | date : 'MMM d' }}</div>
              <i class="bi {{ glyph(day.condition.text, true) }} forecast-glyph" aria-hidden="true"></i>
              <div class="forecast-temps">
                <span class="hi">{{ day.maxtempC | number : '1.0-0' }}°</span>
                <span class="lo text-muted">{{ day.mintempC | number : '1.0-0' }}°</span>
              </div>
            </div>
          </div>
      </div>

      <div class="card bento-alerts" [appReveal]="3">
          <h2 class="section-title">
            <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
            <span>Alerts - {{ forecastLocationName() }}</span>
          </h2>
          <div *ngIf="forecast()?.alerts?.length; else noAlerts" class="d-flex flex-column gap-2">
            <div
              class="p-2 rounded-3 alert-chip"
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
          <h2 class="section-title">
            <i class="bi bi-bookmarks" aria-hidden="true"></i>
            <span>Saved & History</span>
          </h2>
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
        gap: 1.1rem;
        align-items: start;
      }
      .card {
        padding: 1.35rem;
      }
      .bento-hero {
        grid-column: span 5;
        overflow: hidden;
      }
      .bento-chart {
        grid-column: span 7;
      }
      .bento-forecast {
        grid-column: span 8;
      }
      .bento-alerts {
        grid-column: span 4;
      }
      .bento-saved {
        grid-column: span 12;
      }

      /* ---- Hero ---- */
      .bento-hero {
        position: relative;
      }
      .hero-glow {
        position: absolute;
        inset: -40% 30% auto -20%;
        height: 70%;
        background: radial-gradient(
          circle at 30% 30%,
          color-mix(in srgb, var(--accent) 32%, transparent),
          transparent 70%
        );
        filter: blur(10px);
        pointer-events: none;
      }
      .hero-top {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
        gap: 1rem;
      }
      .hero-temp {
        font-family: var(--font-heading);
        font-weight: 700;
        font-size: clamp(3.4rem, 6vw, 4.6rem);
        line-height: 0.95;
        letter-spacing: -0.03em;
        margin-top: 0.2rem;
      }
      .hero-temp .deg {
        font-size: 0.42em;
        font-weight: 600;
        color: var(--text-muted);
        margin-left: 0.1em;
      }
      .hero-cond {
        font-weight: 600;
        font-size: 1.05rem;
        margin-top: 0.15rem;
      }
      .hero-feels {
        font-size: 0.85rem;
        margin-top: 0.1rem;
      }
      .hero-icon {
        font-size: 3.6rem;
        color: var(--accent);
        line-height: 1;
        margin-top: 0.3rem;
        filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--accent) 40%, transparent));
      }
      .hero-metrics {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
        margin-top: 1.4rem;
      }
      .metric-chip {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem 0.8rem;
        border-radius: 0.85rem;
        background: color-mix(in srgb, var(--surface-2) 70%, transparent);
        border: 1px solid var(--border);
      }
      .metric-chip i {
        font-size: 1.1rem;
        color: var(--accent);
      }
      .metric-chip-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }
      .metric-chip-value {
        font-weight: 700;
        font-size: 0.95rem;
      }

      /* ---- Chart ---- */
      .chart-shell {
        height: 240px;
      }

      /* ---- Forecast strip ---- */
      .forecast-strip {
        display: flex;
        gap: 0.7rem;
        overflow-x: auto;
        padding-bottom: 0.4rem;
      }
      .forecast-card {
        flex: 0 0 auto;
        min-width: 92px;
        padding: 0.9rem 0.6rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--surface-2) 70%, transparent);
        border: 1px solid var(--border);
        text-align: center;
        transition: transform 0.25s ease, border-color 0.25s ease;
      }
      .forecast-card:hover {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      }
      .forecast-day {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .forecast-date {
        font-size: 0.72rem;
      }
      .forecast-glyph {
        font-size: 1.7rem;
        color: var(--accent);
        margin: 0.5rem 0;
        display: block;
      }
      .forecast-temps {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      .forecast-temps .hi {
        font-weight: 700;
      }
      .alert-chip {
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
      }
      .stat-divider {
        border-top: 1px solid var(--border);
      }
      .stat-success {
        color: var(--success);
      }
      .stat-danger {
        color: var(--danger);
      }
      .stat-accent {
        color: var(--accent);
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
      @media (max-width: 420px) {
        .hero-metrics {
          grid-template-columns: 1fr;
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

  /** Map a condition string to a Bootstrap-icon glyph (robust fallback when CDN icons are missing). */
  glyph(condition: string | undefined | null, isDay: boolean): string {
    const c = (condition ?? '').toLowerCase();
    if (/thunder|storm/.test(c)) return 'bi-cloud-lightning-rain';
    if (/snow|sleet|ice|blizzard/.test(c)) return 'bi-cloud-snow';
    if (/rain|drizzle|shower/.test(c)) return 'bi-cloud-rain-heavy';
    if (/fog|mist|haze/.test(c)) return 'bi-cloud-fog2';
    if (/cloud|overcast/.test(c)) return isDay ? 'bi-cloud-sun' : 'bi-cloud-moon';
    if (/clear|sun/.test(c)) return isDay ? 'bi-sun' : 'bi-moon-stars';
    return isDay ? 'bi-cloud-sun' : 'bi-cloud-moon';
  }

  chartMetricLabel(): string {
    switch (this.selectedMetric) {
      case 'tempC':
        return 'temperature';
      case 'humidity':
        return 'humidity';
      case 'windKph':
        return 'wind speed';
      default:
        return 'precipitation';
    }
  }

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
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
