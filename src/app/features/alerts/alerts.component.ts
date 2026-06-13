import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row g-3">
      <div class="col-12">
        <div class="card p-4 mb-3">
          <h2 class="section-title">
            <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
            <span>Weather Alerts</span>
          </h2>
          <div class="text-muted small">
            Location: <strong>{{ locationName() || 'Current Location' }}</strong> •
            {{ locationCountry() || 'Unknown' }}
          </div>
          <div class="text-muted small mt-1">
            Total active alerts:
            <strong class="alert-count">{{ alerts().length }}</strong>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card p-4">
          <div class="filter-bar mb-3">
            <span class="text-label">Filter by severity</span>
            <div class="severity-filters">
              <button
                type="button"
                class="btn-outline-accent btn-sm filter-btn"
                [class.active]="filterSeverity === 'all'"
                (click)="filterSeverity = 'all'"
              >
                <i class="bi bi-check-all" aria-hidden="true"></i> All ({{ alerts().length }})
              </button>
              <button
                type="button"
                class="btn-outline-accent btn-sm filter-btn"
                [class.active]="filterSeverity === 'extreme'"
                (click)="filterSeverity = 'extreme'"
              >
                <span class="dot dot-extreme" aria-hidden="true"></span> Extreme
              </button>
              <button
                type="button"
                class="btn-outline-accent btn-sm filter-btn"
                [class.active]="filterSeverity === 'moderate'"
                (click)="filterSeverity = 'moderate'"
              >
                <span class="dot dot-moderate" aria-hidden="true"></span> Moderate
              </button>
            </div>
          </div>

          <div class="alert-list">
            <div
              class="card alert-item"
              [ngClass]="{
                'sev-extreme': alert.severity.toLowerCase() === 'extreme',
                'sev-moderate': alert.severity.toLowerCase() === 'moderate',
                'sev-minor': alert.severity.toLowerCase() === 'minor'
              }"
              appReveal
              [appReveal]="i"
              *ngFor="let alert of filteredAlerts(); let i = index"
            >
              <div class="alert-head">
                <div>
                  <div class="alert-headline">{{ alert.headline }}</div>
                  <small class="text-muted">{{ alert.event }}</small>
                </div>
                <span
                  class="pill severity-pill"
                  [ngClass]="{
                    'sev-extreme': alert.severity.toLowerCase() === 'extreme',
                    'sev-moderate': alert.severity.toLowerCase() === 'moderate',
                    'sev-minor': alert.severity.toLowerCase() === 'minor'
                  }"
                >
                  {{ alert.severity }}
                </span>
              </div>
              <p class="alert-desc">{{ alert.desc }}</p>
              <div class="alert-meta">
                <small class="text-muted">
                  <i class="bi bi-calendar-event" aria-hidden="true"></i> Effective:
                  {{ alert.effective }}
                </small>
                <small class="text-muted">
                  <i class="bi bi-calendar-x" aria-hidden="true"></i> Expires: {{ alert.expires }}
                </small>
                <small class="text-muted" *ngIf="alert.areas">
                  <i class="bi bi-geo-alt" aria-hidden="true"></i> Areas: {{ alert.areas }}
                </small>
              </div>
            </div>
          </div>

          <div *ngIf="!alerts().length" class="empty-state">
            <i class="bi bi-check-circle empty-ok" aria-hidden="true"></i>
            <div class="text-muted mt-2">No active weather alerts in this area.</div>
          </div>
          <div *ngIf="alerts().length && !filteredAlerts().length" class="empty-state">
            <i class="bi bi-search" aria-hidden="true"></i>
            <div class="text-muted mt-2">No alerts match the selected severity level.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .alert-count {
        color: var(--warning);
        font-weight: 700;
      }

      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .severity-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.95rem;
        font-size: 0.85rem;
        cursor: pointer;
      }

      .filter-btn.active {
        background: var(--accent);
        color: var(--accent-contrast);
        border-color: var(--accent);
      }

      .dot {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        display: inline-block;
      }
      .dot-extreme {
        background: var(--danger);
      }
      .dot-moderate {
        background: var(--warning);
      }

      .alert-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .alert-item {
        padding: 1.1rem 1.25rem;
        border-left: 4px solid var(--accent);
      }
      .alert-item.sev-extreme {
        border-left-color: var(--danger);
      }
      .alert-item.sev-moderate {
        border-left-color: var(--warning);
      }
      .alert-item.sev-minor {
        border-left-color: var(--accent);
      }

      .alert-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .alert-headline {
        font-weight: 700;
        font-size: 1.15rem;
        color: var(--text);
      }

      .severity-pill {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }
      .severity-pill.sev-extreme {
        background: color-mix(in srgb, var(--danger) 18%, transparent);
        color: var(--danger);
      }
      .severity-pill.sev-moderate {
        background: color-mix(in srgb, var(--warning) 20%, transparent);
        color: var(--warning);
      }
      .severity-pill.sev-minor {
        background: var(--accent-soft);
        color: var(--accent);
      }

      .alert-desc {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-bottom: 0.6rem;
      }

      .alert-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.85rem;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1.5rem;
      }
      .empty-state > i {
        font-size: 2rem;
        color: var(--text-muted);
      }
      .empty-state .empty-ok {
        color: var(--success);
      }
    `,
  ],
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
