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
    <div class="card error-card" *ngIf="error() as message">
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
      <div class="card loading-hero" *ngIf="isLoading() && !current()">
        <div class="hero-skeleton">
          <div class="skel-stack">
            <div class="skeleton" style="width: 40%; height: 0.9rem;"></div>
            <div class="skeleton" style="width: 60%; height: 1.8rem;"></div>
            <div class="skeleton" style="width: 30%; height: 0.9rem;"></div>
          </div>
          <div class="skeleton" style="width: 96px; height: 96px; border-radius: 50%;"></div>
        </div>
      </div>
      <div class="metric-grid" *ngIf="isLoading() && !current()">
        <div class="card metric-tile" *ngFor="let i of skeletonTiles">
          <div class="skeleton" style="width: 55%; height: 0.8rem;"></div>
          <div class="skeleton" style="width: 70%; height: 1.4rem; margin-top: 0.6rem;"></div>
        </div>
      </div>
    </ng-container>

    <!-- 3. Content state -->
    <ng-container *ngIf="!error() && current() as current">
      <div class="card hero" appTilt>
        <div class="hero-info">
          <div class="text-label">Last saved location</div>
          <h2 class="hero-name">{{ displayName() }}</h2>
          <div class="text-muted">{{ displayCountry() }}</div>
        </div>
        <div class="hero-temp">
          <span class="temp-value">{{ current.tempC }}°C</span>
          <div class="text-muted condition-text">{{ current.condition.text }}</div>
        </div>
        <img
          *ngIf="current.condition.icon"
          [src]="current.condition.icon"
          [alt]="current.condition.text || 'Weather condition'"
          loading="lazy"
          width="96"
          height="96"
          class="hero-icon"
        />
      </div>

      <div class="metric-grid">
        <div
          class="card metric-tile"
          *ngFor="let metric of metrics; let i = index"
          [appReveal]="i"
        >
          <div class="text-label">{{ metric.label }}</div>
          <div class="metric-value">{{ metric.value }}</div>
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1.75rem;
      }
      .hero-info {
        min-width: 0;
      }
      .hero-name {
        font-family: var(--font-heading, inherit);
        font-weight: 700;
        margin: 0.25rem 0 0;
        color: var(--text);
      }
      .hero-temp {
        text-align: right;
      }
      .temp-value {
        font-size: clamp(2.5rem, 8vw, 3.75rem);
        font-weight: 800;
        line-height: 1;
        color: var(--text);
      }
      .condition-text {
        margin-top: 0.35rem;
      }
      .hero-icon {
        flex: 0 0 auto;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-top: 1.25rem;
      }
      .metric-tile {
        padding: 1.1rem 1.25rem;
      }
      .metric-value {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text);
        margin-top: 0.4rem;
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

  get metrics() {
    const c = this.current();
    if (!c) return [];
    return [
      { label: 'Feels like', value: `${c.feelslikeC}°C` },
      { label: 'Wind', value: `${c.windKph} kph ${c.windDir}` },
      { label: 'Pressure', value: `${c.pressureMb} mb` },
      { label: 'Humidity', value: `${c.humidity}%` },
      { label: 'Visibility', value: `${c.visKm} km` },
      { label: 'Clouds', value: `${c.cloud}%` },
      { label: 'UV Index', value: `${c.uv}` },
      { label: 'Precipitation', value: `${c.precipMm} mm` },
    ];
  }
}
