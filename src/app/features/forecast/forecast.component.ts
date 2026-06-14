import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';
import { ForecastDay } from '../../core/models/weather.models';

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
                <div class="hour-time">{{ hour.time | date : 'HH:mm' }}</div>
                <i class="bi {{ glyph(hour.condition.text) }} hour-glyph" aria-hidden="true"></i>
                <div class="hour-temp">{{ hour.tempC | number : '1.0-0' }}°</div>
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
            <div class="day-list">
              <div
                class="day-row"
                appReveal
                [appReveal]="i"
                *ngFor="let day of forecast()?.days; let i = index"
              >
                <div class="day-when">
                  <div class="day-dow">{{ i === 0 ? 'Today' : (day.date | date : 'EEE') }}</div>
                  <div class="day-date text-muted">{{ day.date | date : 'MMM d' }}</div>
                </div>
                <i class="bi {{ glyph(day.condition.text) }} day-glyph" aria-hidden="true"></i>
                <div class="day-cond">
                  <div class="day-cond-text">{{ day.condition.text }}</div>
                  <div class="day-chips">
                    <span class="day-chip"><i class="bi bi-droplet" aria-hidden="true"></i>{{ day.dailyChanceOfRain }}%</span>
                    <span class="day-chip"><i class="bi bi-brightness-high" aria-hidden="true"></i>UV {{ day.uv }}</span>
                  </div>
                </div>
                <div class="day-range">
                  <span class="day-lo">{{ day.mintempC | number : '1.0-0' }}°</span>
                  <span class="day-bar" aria-hidden="true">
                    <span
                      class="day-bar-fill"
                      [style.left.%]="barLeft(day)"
                      [style.width.%]="barWidth(day)"
                    ></span>
                  </span>
                  <span class="day-hi">{{ day.maxtempC | number : '1.0-0' }}°</span>
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
      .header-card .section-title {
        font-size: clamp(1.25rem, 5vw, 1.6rem);
        margin-bottom: 0;
      }
      .header-card .section-title > span {
        overflow-wrap: anywhere;
        word-break: break-word;
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

      .hour-glyph {
        display: block;
        font-size: 1.6rem;
        color: var(--accent);
        margin: 0.45rem 0;
      }

      .day-glyph {
        font-size: 1.9rem;
        color: var(--accent);
        line-height: 1;
      }

      .hour-temp {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text);
      }

      .day-list {
        display: flex;
        flex-direction: column;
      }

      .day-row {
        display: grid;
        grid-template-columns: 4.5rem 2rem 1fr minmax(140px, 16rem);
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 0.25rem;
        border-bottom: 1px solid var(--border);
        max-width: 100%;
      }
      .day-row:last-child {
        border-bottom: none;
      }

      .day-dow {
        font-weight: 700;
        color: var(--text);
      }
      .day-date {
        font-size: 0.78rem;
      }
      .day-glyph {
        font-size: 1.5rem;
        color: var(--accent);
        text-align: center;
      }
      .day-cond {
        min-width: 0;
      }
      .day-cond-text {
        font-weight: 600;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .day-chips {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }
      .day-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .day-chip i {
        color: var(--accent);
        font-size: 0.8rem;
      }

      .day-range {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-width: 0;
      }
      .day-lo {
        color: var(--text-muted);
        font-weight: 600;
        width: 2rem;
        text-align: right;
      }
      .day-hi {
        color: var(--text);
        font-weight: 700;
        width: 2rem;
      }
      .day-bar {
        position: relative;
        flex: 1 1 auto;
        height: 6px;
        border-radius: 999px;
        background: var(--surface-2);
        overflow: hidden;
      }
      .day-bar-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--accent) 55%, transparent),
          var(--accent)
        );
      }

      @media (max-width: 560px) {
        .day-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem 0.75rem;
        }
        .day-when {
          width: 3.5rem;
          flex: 0 0 auto;
        }
        .day-glyph {
          flex: 0 0 auto;
        }
        .day-cond {
          flex: 1 1 auto;
        }
        .day-range {
          flex: 1 1 100%;
          width: 100%;
        }
        .day-bar {
          min-width: 0;
        }
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

  /** Overall temp bounds across the forecast, used to scale the range bars. */
  readonly tempBounds = computed(() => {
    const days = this.forecast()?.days ?? [];
    if (!days.length) return { min: 0, max: 1 };
    const min = Math.min(...days.map((d) => d.mintempC));
    const max = Math.max(...days.map((d) => d.maxtempC));
    return { min, max: max === min ? min + 1 : max };
  });

  /** Left offset (%) of a day's range bar within the overall span. */
  barLeft(day: ForecastDay): number {
    const { min, max } = this.tempBounds();
    return ((day.mintempC - min) / (max - min)) * 100;
  }

  /** Width (%) of a day's range bar within the overall span. */
  barWidth(day: ForecastDay): number {
    const { min, max } = this.tempBounds();
    return Math.max(((day.maxtempC - day.mintempC) / (max - min)) * 100, 6);
  }

  /** Condition string -> Bootstrap-icon glyph (robust fallback for missing CDN icons). */
  glyph(condition: string | undefined | null, isDay = true): string {
    const c = (condition ?? '').toLowerCase();
    if (/thunder|storm/.test(c)) return 'bi-cloud-lightning-rain';
    if (/snow|sleet|ice|blizzard/.test(c)) return 'bi-cloud-snow';
    if (/rain|drizzle|shower/.test(c)) return 'bi-cloud-rain-heavy';
    if (/fog|mist|haze/.test(c)) return 'bi-cloud-fog2';
    if (/cloud|overcast/.test(c)) return isDay ? 'bi-cloud-sun' : 'bi-cloud-moon';
    if (/clear|sun/.test(c)) return isDay ? 'bi-sun' : 'bi-moon-stars';
    return isDay ? 'bi-cloud-sun' : 'bi-cloud-moon';
  }

  reload(): void {
    this.state.reload();
  }
}
