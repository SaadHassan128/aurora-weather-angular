import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row g-3">
      <div class="col-12">
        <div class="glass-card p-4 mb-3">
          <div class="section-title">
            <i class="bi bi-geo-alt"></i>
            <span>Forecast for {{ displayName() }}</span>
          </div>
          <div class="text-muted small">{{ displayCountry() }}</div>
        </div>
      </div>
      <div class="col-12">
        <div class="glass-card p-3">
          <div class="section-title">
            <i class="bi bi-clock-history"></i>
            <span>Hourly (48h)</span>
          </div>
          <div class="d-flex gap-3 overflow-auto pb-2">
            <div
              class="p-3 rounded-4 bg-dark-subtle text-center"
              *ngFor="let hour of hours"
              style="min-width: 120px"
            >
              <div class="fw-semibold">{{ hour.time }}</div>
              <img
                [src]="hour.condition.icon"
                width="42"
                height="42"
                [alt]="hour.condition.text || 'Weather icon'"
              />
              <div class="fw-bold">{{ hour.tempC }}°</div>
              <small class="text-muted">Rain {{ hour.chanceOfRain }}%</small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="glass-card p-3">
          <div class="section-title">
            <i class="bi bi-calendar3"></i>
            <span>Next 7 days</span>
          </div>
          <div class="row g-3">
            <div class="col-12 col-md-6 col-lg-4" *ngFor="let day of forecast()?.days">
              <div class="p-3 rounded-4 bg-dark-subtle h-100">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-semibold">{{ day.date }}</div>
                    <small class="text-muted">{{ day.condition.text }}</small>
                  </div>
                  <img
                    [src]="day.condition.icon"
                    width="42"
                    height="42"
                    [alt]="day.condition.text || 'Weather icon'"
                  />
                </div>
                <div class="d-flex justify-content-between mt-2">
                  <div>High: {{ day.maxtempC }}°</div>
                  <div>Low: {{ day.mintempC }}°</div>
                </div>
                <div class="text-muted small mt-1">
                  Rain: {{ day.dailyChanceOfRain }}% • UV {{ day.uv }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForecastComponent {
  private readonly state = inject(WeatherStateService);
  private readonly locations = inject(LocationService);
  readonly forecast = computed(() => this.state.forecast());

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
}
