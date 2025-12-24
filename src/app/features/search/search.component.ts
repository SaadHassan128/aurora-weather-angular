import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationSummary } from '../../core/models/weather.models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div class="section-title mb-0">
            <i class="bi bi-search"></i>
            <span>Search locations</span>
          </div>
          <div class="text-muted small">Type a city, ZIP, or coordinates</div>
        </div>
        <div class="text-muted small d-flex align-items-center gap-2">
          <span>Recent:</span>
          <button
            class="btn btn-sm btn-outline-light"
            *ngFor="let recent of locations.recent()"
            (click)="quickSelect(recent.query)"
          >
            {{ recent.query }}
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            (click)="clearSearches()"
            *ngIf="locations.recent().length"
          >
            Clear
          </button>
        </div>
      </div>

      <div class="input-group mt-3">
        <span class="input-group-text bg-dark border-secondary text-muted"
          ><i class="bi bi-search"></i
        ></span>
        <input
          class="form-control bg-dark text-white border-secondary"
          type="search"
          [formControl]="query"
          placeholder="e.g. London, 10001, 48.85,2.35"
        />
      </div>

      <div class="row g-3 mt-3">
        <div class="col-12 col-md-6 col-lg-4" *ngFor="let loc of results; trackBy: trackByLocation">
          <div class="p-3 rounded-4 bg-dark-subtle h-100 d-flex flex-column">
            <div class="fw-semibold">{{ loc.name }}</div>
            <small class="text-muted">{{ loc.region }} • {{ loc.country }}</small>
            <div class="mt-auto d-flex gap-2 pt-2">
              <button class="btn btn-sm btn-primary" (click)="select(loc)">View</button>
              <button class="btn btn-sm btn-outline-light" (click)="save(loc)">Save</button>
            </div>
          </div>
        </div>
        <div class="col-12" *ngIf="loading">
          <div class="text-muted">Searching…</div>
        </div>
        <div class="col-12" *ngIf="!loading && error">
          <div class="alert alert-warning mb-0">{{ error }}</div>
        </div>
        <div class="col-12" *ngIf="!loading && !error && !results.length && query.value">
          <div class="text-muted">No matches yet.</div>
        </div>
      </div>
    </div>
  `,
})
export class SearchComponent {
  private readonly api = inject(WeatherApiService);
  private readonly weather = inject(WeatherStateService);
  readonly locations = inject(LocationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  query = new FormControl('');
  results: LocationSummary[] = [];
  error = '';
  loading = false;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q');
      if (q && q !== this.query.value) {
        this.query.setValue(q);
      }
    });
    this.query.valueChanges
      ?.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading = true;
          this.error = '';
          return this.api.searchLocations(q ?? '');
        })
      )
      .subscribe({
        next: (res) => {
          this.results = res;
          this.loading = false;
        },
        error: (err) => {
          this.results = [];
          this.loading = false;
          this.error =
            err?.status === 401
              ? 'WeatherAPI rejected the key (401). Please verify the API key.'
              : err?.status === 403
              ? 'WeatherAPI denied the request (check plan/permissions).'
              : 'Unable to fetch locations right now.';
        },
      });
  }

  select(loc: LocationSummary) {
    this.locations.addRecent(loc.name);
    this.weather.setLocation(`${loc.lat},${loc.lon}`);
    // record that the user viewed this location from search
    this.locations.recordAction('view', loc.name);
    // explicitly navigate to dashboard so the user sees details
    this.router.navigate(['/dashboard']);
  }

  save(loc: LocationSummary) {
    this.locations.upsertLocation({ ...loc, default: !this.locations.saved().length });
    // ensure this saved location becomes the active location so Dashboard shows it
    this.locations.addRecent(loc.name);
    this.weather.setLocation(`${loc.lat},${loc.lon}`);
    // navigate to saved locations page
    this.router.navigate(['/saved']);
  }

  quickSelect(query: string) {
    this.weather.setLocation(query);
  }

  clearSearches() {
    this.locations.recent.set([]);
    this.locations.history.set([]);
    this.locations.removeAllHistory();
  }

  trackByLocation = (_: number, loc: LocationSummary) => loc?.name + '_' + loc?.lat + '_' + loc?.lon;
}
