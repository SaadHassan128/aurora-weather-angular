import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-current',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-4" *ngIf="current() as current; else emptyState">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <div class="text-muted small">Last saved location</div>
          <h2 class="mb-0">{{ displayName() }}</h2>
          <div class="text-muted">{{ displayCountry() }}</div>
        </div>
        <div class="text-end">
          <h1 class="display-4 mb-0">{{ current.tempC }}°C</h1>
          <div class="text-muted">{{ current.condition.text }}</div>
        </div>
        <img *ngIf="current.condition.icon" [src]="current.condition.icon" width="96" height="96" />
      </div>

      <div class="row mt-4 g-3">
        <div class="col-6 col-md-3" *ngFor="let metric of metrics">
          <div class="p-3 rounded-4 bg-dark-subtle h-100">
            <div class="text-muted small">{{ metric.label }}</div>
            <div class="fw-semibold fs-5">{{ metric.value }}</div>
          </div>
        </div>
      </div>
    </div>
    <ng-template #emptyState>
      <div class="glass-card p-4 text-muted">No current weather available yet.</div>
    </ng-template>
  `,
})
export class CurrentComponent {
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);
  readonly current = computed(() => this.state.currentWeather());

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
