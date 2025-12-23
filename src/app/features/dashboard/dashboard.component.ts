import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="row g-3">
      <div class="col-12 col-lg-4" *ngIf="current() as current">
        <div class="glass-card p-3 h-100">
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
      </div>

      <div class="col-12 col-lg-8">
        <div class="glass-card p-3 h-100">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="section-title mb-0">
              <i class="bi bi-graph-up"></i>
              <span>Next hours - {{ currentLocationName() }}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="btn-group btn-group-sm" role="group">
                <button
                  class="btn btn-outline-info"
                  [class.active]="selectedMetric === 'tempC'"
                  (click)="selectMetric('tempC')"
                >
                  Temp
                </button>
                <button
                  class="btn btn-outline-info"
                  [class.active]="selectedMetric === 'humidity'"
                  (click)="selectMetric('humidity')"
                >
                  Humidity
                </button>
                <button
                  class="btn btn-outline-info"
                  [class.active]="selectedMetric === 'windKph'"
                  (click)="selectMetric('windKph')"
                >
                  Wind
                </button>
                <button
                  class="btn btn-outline-info"
                  [class.active]="selectedMetric === 'precipMm'"
                  (click)="selectMetric('precipMm')"
                >
                  Precip
                </button>
              </div>
              <div class="input-group input-group-sm" style="width: clamp(200px, 45vw, 320px);">
                <span class="input-group-text bg-dark border-secondary text-muted">Country</span>
                <input
                  class="form-control bg-dark text-white border-secondary"
                  type="text"
                  [value]="countryQuery"
                  (input)="countryQuery = ($any($event.target).value || '').trim()"
                  placeholder="e.g. France"
                />
                <button class="btn btn-info" (click)="applyCountry()">Go</button>
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
      </div>

      <div class="col-12 col-xl-8">
        <div class="glass-card p-3">
          <div class="section-title">
            <i class="bi bi-calendar-week"></i>
            <span>Daily forecast - {{ forecastLocationName() }}</span>
          </div>
          <div class="d-flex flex-nowrap overflow-auto gap-3 pb-2">
            <div
              class="forecast-card p-3 rounded-4 bg-dark-subtle text-center"
              *ngFor="let day of forecast()?.days"
            >
              <div class="fw-semibold">{{ day.date }}</div>
              <img [src]="day.condition.icon" width="48" height="48" alt="icon" />
              <div class="fw-bold">{{ day.maxtempC }}° / {{ day.mintempC }}°</div>
              <small class="text-muted">{{ day.condition.text }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="glass-card p-3 h-100">
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
      </div>
      <div class="col-12 col-xl-4">
        <div class="glass-card p-3 h-100">
          <div class="section-title">
            <i class="bi bi-bookmarks"></i>
            <span>Saved & History</span>
          </div>
          <div class="mb-3">
            <div class="fw-semibold">Saved</div>
            <div
              *ngFor="let s of locations.saved()"
              class="d-flex justify-content-between align-items-center small text-muted py-1"
            >
              <div>{{ s.name }}</div>
              <button class="btn btn-sm btn-link" (click)="openSaved(s)">Open</button>
            </div>
            <div *ngIf="!locations.saved().length" class="text-muted small">No saved locations</div>
          </div>
          <div>
            <div class="fw-semibold">Recent searches</div>
            <div *ngFor="let r of locations.recent()" class="small text-muted py-1">
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
    </div>
  `,
  styles: [
    `
      .forecast-card {
        min-width: 140px;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly state = inject(WeatherStateService);
  readonly locations = inject(LocationService);

  readonly current = computed(() => this.state.currentWeather());
  readonly forecast = computed(() => this.state.forecast());

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
        titleColor: '#00d9ff',
        bodyColor: '#76ff00',
        borderColor: '#b366ff',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#00d9ff', font: { size: 11, weight: 'bold' } },
        grid: { color: 'rgba(0,217,255,0.1)' },
      },
      y: {
        ticks: { color: '#76ff00', font: { size: 11, weight: 'bold' } },
        grid: { color: 'rgba(118,255,0,0.1)' },
      },
    },
  };

  readonly avgMetric = computed(() => {
    const hours = this.forecast()?.days?.[0]?.hours ?? [];
    if (!hours.length) return 0;
    const sum = hours.reduce((a, h) => a + this.valueByMetric(h), 0);
    return Math.round((sum / hours.length) * 10) / 10;
  });

  readonly highMetric = computed(() => {
    const hours = this.forecast()?.days?.[0]?.hours ?? [];
    return Math.max(...hours.map((h) => this.valueByMetric(h)), 0);
  });

  readonly lowMetric = computed(() => {
    const hours = this.forecast()?.days?.[0]?.hours ?? [];
    return Math.min(...hours.map((h) => this.valueByMetric(h)), 0);
  });

  get unitLabel(): string {
    if (this.selectedMetric === 'tempC') return '°C';
    if (this.selectedMetric === 'humidity') return '%';
    if (this.selectedMetric === 'windKph') return ' kph';
    return ' mm';
  }

  get seriesChartData(): ChartConfiguration['data'] {
    const hours = this.forecast()?.days?.[0]?.hours ?? [];
    const label =
      this.selectedMetric === 'tempC'
        ? 'Temperature (°C)'
        : this.selectedMetric === 'humidity'
        ? 'Humidity (%)'
        : this.selectedMetric === 'windKph'
        ? 'Wind (kph)'
        : 'Precipitation (mm)';
    return {
      labels: hours.map((h) => {
        const t = String(h.time);
        const timePart = t.includes('T') ? t.split('T')[1] : t.split(' ')[1] ?? t;
        return (timePart ?? '').slice(0, 5);
      }),
      datasets: [
        {
          label,
          data: hours.map((h) => this.valueByMetric(h)),
          tension: 0.4,
          fill: true,
          borderColor: '#00d9ff',
          backgroundColor: 'rgba(0,217,255,0.2)',
          pointBackgroundColor: '#ff006e',
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
    this.state.setLocation(this.countryQuery);
  }

  private valueByMetric(h: any): number {
    if (this.selectedMetric === 'tempC') return h.tempC ?? 0;
    if (this.selectedMetric === 'humidity') return h.humidity ?? 0;
    if (this.selectedMetric === 'windKph') return h.windKph ?? 0;
    return h.willItRain ? 1 : 0;
  }

  openSaved(s: any) {
    const target = `${s.lat},${s.lon}`;
    this.locations.addRecent(s.name);
    this.locations.recordAction('view', s.name);
    this.state.setLocation(target);
  }
}
