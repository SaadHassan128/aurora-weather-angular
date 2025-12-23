import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row g-3">
      <div class="col-12">
        <div class="glass-card p-4 mb-3">
          <div class="section-title">
            <i class="bi bi-exclamation-triangle"></i>
            <span>Weather Alerts</span>
          </div>
          <div class="text-muted small">
            Location: <strong>{{ locationName() || 'Current Location' }}</strong> •
            {{ locationCountry() || 'Unknown' }}
          </div>
          <div class="text-muted small mt-1">
            Total active alerts: <strong class="text-warning">{{ alerts().length }}</strong>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="glass-card p-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="fw-bold">Filter by severity:</span>
            <div class="btn-group btn-group-sm">
              <button
                type="button"
                class="btn btn-outline-light"
                [class.active]="filterSeverity === 'all'"
                (click)="filterSeverity = 'all'"
              >
                <i class="bi bi-check-all"></i> All ({{ alerts().length }})
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                [class.active]="filterSeverity === 'extreme'"
                (click)="filterSeverity = 'extreme'"
              >
                <i class="bi bi-exclamation-circle"></i> Extreme
              </button>
              <button
                type="button"
                class="btn btn-outline-warning"
                [class.active]="filterSeverity === 'moderate'"
                (click)="filterSeverity = 'moderate'"
              >
                <i class="bi bi-exclamation-triangle"></i> Moderate
              </button>
            </div>
          </div>

          <div class="list-group">
            <div
              class="list-group-item bg-dark-subtle text-white border-secondary mb-2 p-3 rounded-3"
              *ngFor="let alert of filteredAlerts()"
            >
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div class="fw-bold fs-5">{{ alert.headline }}</div>
                  <small class="text-muted">{{ alert.event }}</small>
                </div>
                <span
                  class="badge fw-bold"
                  [ngClass]="{
                    'bg-danger': alert.severity.toLowerCase() === 'extreme',
                    'bg-warning text-dark': alert.severity.toLowerCase() === 'moderate',
                    'bg-info': alert.severity.toLowerCase() === 'minor'
                  }"
                >
                  {{ alert.severity }}
                </span>
              </div>
              <p class="small text-light mb-2">{{ alert.desc }}</p>
              <div class="d-flex gap-3 flex-wrap">
                <small class="text-muted">
                  <i class="bi bi-calendar-event"></i> Effective: {{ alert.effective }}
                </small>
                <small class="text-muted">
                  <i class="bi bi-calendar-x"></i> Expires: {{ alert.expires }}
                </small>
                <small class="text-muted" *ngIf="alert.areas">
                  <i class="bi bi-geo-alt"></i> Areas: {{ alert.areas }}
                </small>
              </div>
            </div>
          </div>

          <div *ngIf="!alerts().length" class="text-center py-5">
            <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
            <div class="text-muted mt-2">No active weather alerts in this area.</div>
          </div>
          <div *ngIf="alerts().length && !filteredAlerts().length" class="text-center py-5">
            <i class="bi bi-search text-muted" style="font-size: 2rem;"></i>
            <div class="text-muted mt-2">No alerts match the selected severity level.</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AlertsComponent {
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);

  readonly alerts = computed(() => this.state.forecast()?.alerts ?? []);

  readonly locationName = computed(() => {
    const forecastLoc = this.state.forecast()?.location?.name;
    if (forecastLoc) return forecastLoc;
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.name || this.locations.saved()[0]?.name;
  });

  readonly locationCountry = computed(() => {
    const forecastLoc = this.state.forecast()?.location?.country;
    if (forecastLoc) return forecastLoc;
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.country || this.locations.saved()[0]?.country;
  });

  readonly lastSavedName = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.name || this.locations.saved()[0]?.name;
  });

  readonly lastSavedCountry = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.country || this.locations.saved()[0]?.country;
  });

  filterSeverity: string = 'all';

  filteredAlerts = computed(() => {
    const all = this.alerts();
    if (this.filterSeverity === 'all') return all;
    return all.filter((a) => a.severity.toLowerCase() === this.filterSeverity.toLowerCase());
  });
}
