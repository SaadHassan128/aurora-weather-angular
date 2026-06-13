import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { LocationService } from '../../core/services/location.service';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationSummary } from '../../core/models/weather.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card search-card">
      <div class="search-head">
        <div>
          <div class="section-title mb-0">
            <i class="bi bi-search"></i>
            <span>Search locations</span>
          </div>
          <div class="text-label">Type a city, ZIP, or coordinates</div>
        </div>
        <div class="recents" *ngIf="locations.recent().length">
          <span class="text-label recents-label">Recent</span>
          <button
            type="button"
            class="btn-outline-accent btn-sm chip"
            *ngFor="let recent of locations.recent()"
            (click)="quickSelect(recent.query)"
          >
            {{ recent.query }}
          </button>
          <button type="button" class="btn-sm chip chip-clear" (click)="clearSearches()">
            <i class="bi bi-x-lg"></i>
            Clear
          </button>
        </div>
      </div>

      <div class="search-field">
        <i class="bi bi-search search-field-icon" aria-hidden="true"></i>
        <input
          class="search-input"
          type="search"
          [formControl]="query"
          aria-label="Search locations"
          placeholder="e.g. London, 10001, 48.85,2.35"
        />
      </div>

      <!-- Loading skeletons -->
      <div class="result-grid" *ngIf="loading">
        <div class="card result-tile skeleton-tile" *ngFor="let s of [1, 2, 3, 4, 5, 6]">
          <span class="skeleton skeleton-line lg"></span>
          <span class="skeleton skeleton-line sm"></span>
          <span class="skeleton skeleton-line btns"></span>
        </div>
      </div>

      <!-- Error state -->
      <div class="card error-card" *ngIf="!loading && error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <span>{{ error }}</span>
      </div>

      <!-- Results -->
      <div class="result-grid" *ngIf="!loading && !error && results.length">
        <div
          class="card result-tile"
          appReveal
          [appReveal]="i"
          *ngFor="let loc of results; let i = index; trackBy: trackByLocation"
        >
          <div class="result-name">{{ loc.name }}</div>
          <div class="text-label">{{ loc.region }} • {{ loc.country }}</div>
          <div class="result-actions">
            <button type="button" class="btn-accent btn-sm" (click)="select(loc)">
              <i class="bi bi-eye" aria-hidden="true"></i>
              View
            </button>
            <button type="button" class="btn-outline-accent btn-sm" (click)="save(loc)">
              <i class="bi bi-bookmark-plus" aria-hidden="true"></i>
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- No matches -->
      <div
        class="empty-state"
        *ngIf="!loading && !error && !results.length && query.value"
      >
        <i class="bi bi-search-heart" aria-hidden="true"></i>
        <span>No matches for "{{ query.value }}".</span>
      </div>

      <!-- Initial empty -->
      <div
        class="empty-state"
        *ngIf="!loading && !error && !results.length && !query.value"
      >
        <i class="bi bi-search" aria-hidden="true"></i>
        <span>Search any city to get started.</span>
      </div>
    </div>
  `,
  styles: [
    `
      .search-card {
        padding: 1.5rem;
      }

      .search-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .recents {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .recents-label {
        margin-right: 0.15rem;
      }

      .chip {
        padding: 0.35rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 600;
        border-radius: var(--radius-pill);
        cursor: pointer;
      }

      .chip-clear {
        background: transparent;
        color: var(--danger);
        border: 1px solid var(--danger);
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .chip-clear:hover {
        background: var(--danger);
        color: var(--danger-contrast);
      }

      .search-field {
        position: relative;
        margin-top: 1.25rem;
      }

      .search-field-icon {
        position: absolute;
        left: 1.15rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
        font-size: 1.05rem;
      }

      .search-input {
        width: 100%;
        background: var(--surface-2);
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: var(--radius-pill);
        padding: 0.95rem 1.25rem 0.95rem 3rem;
        font-size: 1.05rem;
        font-family: var(--font-body);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .search-input::placeholder {
        color: var(--text-muted);
      }

      .search-input:focus {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
        border-color: var(--accent);
      }

      .result-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .result-tile {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1.1rem;
        height: 100%;
      }

      .result-name {
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--text);
      }

      .result-actions {
        display: flex;
        gap: 0.6rem;
        margin-top: auto;
        padding-top: 0.85rem;
      }

      .result-actions .btn-sm {
        padding: 0.45rem 1rem;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }

      .skeleton-tile {
        gap: 0.6rem;
        min-height: 130px;
      }

      .skeleton-line.lg {
        height: 1.25rem;
        width: 70%;
      }

      .skeleton-line.sm {
        height: 0.85rem;
        width: 50%;
      }

      .skeleton-line.btns {
        height: 1.8rem;
        width: 60%;
        margin-top: auto;
      }

      .error-card {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 1.5rem;
        padding: 1rem 1.25rem;
        border-color: var(--danger);
        color: var(--danger);
      }

      .error-card i {
        font-size: 1.15rem;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 2rem;
        padding: 2.5rem 1rem;
        color: var(--text-muted);
        text-align: center;
      }

      .empty-state i {
        font-size: 2rem;
        color: var(--accent);
      }
    `,
  ],
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
