import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-current',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealDirective, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Error state (highest priority) -->
    <div class="card error-card" *ngIf="error() as message" role="alert">
      <i class="bi bi-exclamation-triangle warn-icon" aria-hidden="true"></i>
      <div>
        <div class="section-title mb-1">Something went wrong</div>
        <p class="text-muted mb-3">{{ message }}</p>
        <button type="button" class="btn btn-outline-accent" (click)="reload()">
          Try again
        </button>
      </div>
    </div>

    <!-- 2. Loading state (no data yet) -->
    <ng-container *ngIf="!error()">
      <div
        class="card loading-hero"
        *ngIf="isLoading() && !current()"
        aria-busy="true"
        aria-live="polite"
      >
        <span class="visually-hidden">Loading current conditions…</span>
        <div class="hero-skeleton" aria-hidden="true">
          <div class="skel-stack">
            <div class="skeleton" style="width: 40%; height: 0.9rem;"></div>
            <div class="skeleton" style="width: 60%; height: 1.8rem;"></div>
            <div class="skeleton" style="width: 30%; height: 0.9rem;"></div>
          </div>
          <div class="skeleton" style="width: 96px; height: 96px; border-radius: 50%;"></div>
        </div>
      </div>
      <div class="metric-grid" *ngIf="isLoading() && !current()" aria-hidden="true">
        <div class="card metric-tile" *ngFor="let i of skeletonTiles">
          <div class="skeleton" style="width: 55%; height: 0.8rem;"></div>
          <div class="skeleton" style="width: 70%; height: 1.4rem; margin-top: 0.6rem;"></div>
        </div>
      </div>
    </ng-container>

    <!-- 3. Content state -->
    <ng-container *ngIf="!error() && current() as current">
      <div class="card hero" appTilt>
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="hero-info">
          <div class="text-label">{{ displayName() }} · {{ displayCountry() }}</div>
          <div class="temp-row">
            <span class="temp-value" [attr.aria-label]="current.tempC + ' degrees Celsius'">{{ current.tempC | number : '1.0-0' }}<span class="deg">°C</span></span>
          </div>
          <div class="condition-text">{{ current.condition.text }}</div>
          <div class="text-muted feels">Feels like {{ current.feelslikeC | number : '1.0-0' }}°</div>
        </div>
        <i class="bi {{ glyph(current.condition.text, current.isDay) }} hero-icon" aria-hidden="true"></i>
      </div>

      <div class="metric-grid">
        <div
          class="card metric-tile"
          *ngFor="let metric of metrics; let i = index"
          [appReveal]="i"
        >
          <i class="bi {{ metric.icon }} metric-icon" aria-hidden="true"></i>
          <div class="metric-body">
            <div class="text-label">{{ metric.label }}</div>
            <div class="metric-value">{{ metric.value }}</div>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- 4. Empty state (lowest priority) -->
    <div
      class="card empty-card"
      *ngIf="!error() && !isLoading() && !current()"
    >
      <i class="bi bi-search empty-icon" aria-hidden="true"></i>
      <p class="text-muted mb-3">Search for a location to see current conditions.</p>
      <a class="btn btn-accent" routerLink="/search">Search locations</a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .hero {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem 2.25rem;
        overflow: hidden;
      }
      .hero-glow {
        position: absolute;
        inset: -50% 20% auto -10%;
        height: 90%;
        background: radial-gradient(
          circle at 30% 30%,
          color-mix(in srgb, var(--accent) 28%, transparent),
          transparent 70%
        );
        filter: blur(12px);
        pointer-events: none;
      }
      .hero-info {
        position: relative;
        min-width: 0;
        text-align: left;
      }
      .temp-row {
        margin-top: 0.3rem;
      }
      .temp-value {
        font-family: var(--font-heading, inherit);
        font-size: clamp(3.2rem, 9vw, 5rem);
        font-weight: 700;
        line-height: 0.95;
        letter-spacing: -0.03em;
        color: var(--text);
      }
      .temp-value .deg {
        font-size: 0.4em;
        font-weight: 600;
        color: var(--text-muted);
        margin-left: 0.08em;
      }
      .condition-text {
        font-weight: 600;
        font-size: 1.1rem;
        margin-top: 0.4rem;
      }
      .feels {
        font-size: 0.9rem;
        margin-top: 0.15rem;
      }
      .hero-icon {
        position: relative;
        flex: 0 0 auto;
        font-size: 5rem;
        color: var(--accent);
        line-height: 1;
        filter: drop-shadow(0 8px 18px color-mix(in srgb, var(--accent) 40%, transparent));
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-top: 1.1rem;
      }
      .metric-tile {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 1.1rem 1.25rem;
      }
      .metric-icon {
        font-size: 1.4rem;
        color: var(--accent);
        flex: 0 0 auto;
      }
      .metric-body {
        min-width: 0;
      }
      .metric-value {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--text);
        margin-top: 0.2rem;
      }

      .loading-hero {
        padding: 1.75rem;
      }
      .hero-skeleton {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
      }
      .skel-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        flex: 1 1 auto;
      }

      .error-card,
      .empty-card {
        padding: 1.75rem;
        text-align: center;
      }
      .error-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        text-align: left;
      }
      .empty-card {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .warn-icon,
      .empty-icon {
        font-size: 1.75rem;
        color: var(--accent);
      }
      .warn-icon {
        line-height: 1.2;
      }
      .empty-icon {
        margin-bottom: 0.75rem;
      }

      @media (max-width: 768px) {
        .metric-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 480px) {
        .metric-grid {
          grid-template-columns: 1fr;
        }
        .hero,
        .hero-temp {
          text-align: left;
        }
      }
    `,
  ],
})
export class CurrentComponent {
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);

  readonly current = computed(() => this.state.currentWeather());
  readonly isLoading = computed(() => this.state.isLoading());
  readonly error = computed(() => this.state.error());

  /** Placeholder tiles for the loading skeleton grid (matches 8 metrics). */
  readonly skeletonTiles = Array.from({ length: 8 });

  readonly lastSavedName = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.name || this.locations.saved()[0]?.name;
  });

  readonly lastSavedCountry = computed(() => {
    const defaultLoc = this.locations.saved().find((l) => l.default);
    return defaultLoc?.country || this.locations.saved()[0]?.country;
  });

  readonly displayName = computed(() => {
    return this.lastSavedName() || this.current()?.location?.name || 'Current Location';
  });

  readonly displayCountry = computed(() => {
    return this.lastSavedCountry() || this.current()?.location?.country || 'Unknown';
  });

  reload() {
    this.state.reload();
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

  get metrics() {
    const c = this.current();
    if (!c) return [];
    return [
      { label: 'Feels like', value: `${Math.round(c.feelslikeC)}°C`, icon: 'bi-thermometer-half' },
      { label: 'Wind', value: `${Math.round(c.windKph)} kph ${c.windDir}`.trim(), icon: 'bi-wind' },
      { label: 'Pressure', value: `${Math.round(c.pressureMb)} mb`, icon: 'bi-speedometer2' },
      { label: 'Humidity', value: `${c.humidity}%`, icon: 'bi-droplet-half' },
      { label: 'Visibility', value: `${Math.round(c.visKm)} km`, icon: 'bi-eye' },
      { label: 'Clouds', value: `${c.cloud}%`, icon: 'bi-clouds' },
      { label: 'UV Index', value: `${c.uv}`, icon: 'bi-brightness-high' },
      { label: 'Precipitation', value: `${c.precipMm} mm`, icon: 'bi-cloud-drizzle' },
    ];
  }
}
