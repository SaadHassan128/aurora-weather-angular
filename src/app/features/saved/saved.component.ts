import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../core/services/location.service';
import { WeatherStateService } from '../../core/services/weather-state.service';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card p-4">
      <div class="section-title">
        <i class="bi bi-bookmark-heart"></i>
        <span>Saved locations</span>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-6 col-lg-4" *ngFor="let loc of locations.saved(); let i = index">
          <div class="p-3 rounded-4 bg-dark-subtle h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-semibold">{{ loc.name }}</div>
                <small class="text-muted">{{ loc.country }}</small>
              </div>
              <span class="badge bg-info" *ngIf="loc.default">Default</span>
            </div>
            <div class="mt-2 text-muted small">Lat {{ loc.lat }} / Lon {{ loc.lon }}</div>
            <div class="d-flex gap-2 mt-auto pt-2">
              <button class="btn btn-sm btn-primary" (click)="open(loc.name, loc.lat, loc.lon)">
                Open
              </button>
              <button class="btn btn-sm btn-outline-light" (click)="setDefault(loc.name)">
                Default
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="remove(loc.name)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="!locations.saved().length" class="text-muted">No saved locations yet.</div>
    </div>
  `,
})
export class SavedComponent {
  readonly locations = inject(LocationService);
  private readonly state = inject(WeatherStateService);

  open(name: string, lat?: number, lon?: number) {
    const target = lat != null && lon != null ? `${lat},${lon}` : name;
    this.locations.addRecent(name);
    this.locations.recordAction('view', name);
    this.state.setLocation(target);
  }

  setDefault(name: string) {
    this.locations.setDefault(name);
  }

  remove(name: string) {
    this.locations.removeLocation(name);
  }
}
