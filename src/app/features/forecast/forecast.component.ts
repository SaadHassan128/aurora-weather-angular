import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, RevealDirective, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forecast-stack">
      <!-- Header card -->
      <div class="card header-card" appTilt>
        <h2 class="section-title">
          <i class="bi bi-geo-alt" aria-hidden="true"></i>
          <span>Forecast for {{ displayName() }}</span>
        </h2>
        <div class="text-label" *ngIf="displayCountry()">{{ displayCountry() }}</div>
      </div>

      <!-- Error state (highest priority) -->
      <div class="card" *ngIf="error(); else loadingBlock" role="alert">
        <div class="section-title">
          <i class="bi bi-exclamation-triangle"></i>
          <span>Something went wrong</span>
        </div>
        <p class="text-label mb-3">{{ error() }}</p>
        <button type="button" class="btn-outline-accent" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i>
          Try again
        </button>
      </div>

      <ng-template #loadingBlock>
        <!-- Loading skeleton -->
        <ng-container *ngIf="isLoading() && !forecast(); else contentBlock">
          <span class="visually-hidden" aria-live="polite">Loading forecast…</span>
          <div class="card" aria-busy="true" aria-hidden="true">
            <div class="section-title">
              <i class="bi bi-clock-history"></i>
              <span>Hourly (48h)</span>
            </div>
            <div class="hour-strip">
              <div class="hour-tile skeleton" *ngFor="let s of [1, 2, 3, 4, 5, 6, 7, 8]"></div>
            </div>
          </div>
          <div class="card" aria-hidden="true">
            <div class="section-title">
              <i class="bi bi-calendar3"></i>
              <span>Next 7 days</span>
            </div>
            <div class="day-grid">
              <div
                class="day-skeleton skeleton"
                *ngFor="let s of [1, 2, 3, 4, 5, 6, 7]"
              ></div>
            </div>
          </div>
        </ng-container>
      </ng-template>

      <ng-template #contentBlock>
        <!-- Content -->
        <ng-container *ngIf="forecast(); else emptyBlock">
          <!-- Hourly strip -->
          <div class="card">
            <div class="section-title">
              <i class="bi bi-clock-history"></i>
              <span>Hourly (48h)</span>
            </div>
            <div class="hour-strip">
              <div class="hour-tile" *ngFor="let hour of hours">
                <div class="hour-time">{{ hour.time }}</div>
                <img
                  [src]="hour.condition.icon"
                  width="42"
                  height="42"
                  loading="lazy"
                  [alt]="hour.condition.text || 'Weather icon'"
                />
                <div class="hour-temp">{{ hour.tempC }}°</div>
                <div class="text-label">Rain {{ hour.chanceOfRain }}%</div>
              </div>
            </div>
          </div>

          <!-- 7-day grid -->
          <div class="card">
            <div class="section-title">
              <i class="bi bi-calendar3"></i>
              <span>Next 7 days</span>
            </div>
            <div class="day-grid">
              <div
                class="card day-card"
                appReveal
                [appReveal]="i"
                *ngFor="let day of forecast()?.days; let i = index"
              >
                <div class="day-head">
                  <div>
                    <div class="day-date">{{ day.date }}</div>
                    <div class="text-label">{{ day.condition.text }}</div>
                  </div>
                  <img
                    [src]="day.condition.icon"
                    width="42"
                    height="42"
                    loading="lazy"
                    [alt]="day.condition.text || 'Weather icon'"
                  />
                </div>
                <div class="day-temps">
                  <div><span class="text-label">High</span> {{ day.maxtempC }}°</div>
                  <div><span class="text-label">Low</span> {{ day.mintempC }}°</div>
                </div>
                <div class="day-meta">
                  <span class="text-label">Rain</span> {{ day.dailyChanceOfRain }}%
                  &middot; <span class="text-label">UV</span> {{ day.uv }}
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-template>

      <ng-template #emptyBlock>
        <div class="card empty-card">
          <i class="bi bi-cloud-slash"></i>
          <span>No forecast available yet.</span>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .forecast-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .header-card .text-label {
        margin-top: 0.25rem;
      }

      .hour-strip {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        scroll-snap-type: x proximity;
      }

      .hour-tile {
        flex: 0 0 auto;
        min-width: 110px;
        text-align: center;
        padding: 0.85rem 0.75rem;
        border-radius: 14px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        scroll-snap-align: start;
      }

      .hour-tile.skeleton {
        min-height: 130px;
      }

      .hour-time {
        font-weight: 600;
        color: var(--text);
      }

      .hour-temp {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text);
      }

      .day-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.85rem;
      }

      .day-card {
        height: 100%;
      }

      .day-skeleton {
        min-height: 150px;
        border-radius: 14px;
      }

      .day-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }

      .day-date {
        font-weight: 600;
        color: var(--text);
      }

      .day-temps {
        display: flex;
        justify-content: space-between;
        margin-top: 0.75rem;
        color: var(--text);
      }

      .day-meta {
        margin-top: 0.5rem;
        color: var(--text-muted);
        font-size: 0.85rem;
      }

      .empty-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-muted);
      }

      .empty-card i {
        color: var(--accent);
      }
    `,
  ],
})
export class ForecastComponent {
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);
  readonly forecast = computed(() => this.state.forecast());
  readonly isLoading = computed(() => this.state.isLoading());
  readonly error = computed(() => this.state.error());

  readonly lastSavedName = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.name || this.locations.saved()[0]?.name;
  });

  readonly lastSavedCountry = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.country || this.locations.saved()[0]?.country;
  });

  readonly displayName = computed(() => {
    return this.forecast()?.location?.name || this.lastSavedName() || 'Current location';
  });

  readonly displayCountry = computed(() => {
    return this.forecast()?.location?.country || this.lastSavedCountry() || '';
  });

  get hours() {
    const day0 = this.forecast()?.days?.[0];
    return day0?.hours ?? [];
  }

  reload(): void {
    this.state.reload();
  }
}
