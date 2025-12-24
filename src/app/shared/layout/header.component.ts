import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { LocationService } from '../../core/services/location.service';
import { LocationSummary } from '../../core/models/weather.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  template: `
    <nav class="navbar navbar-expand-lg px-3 py-3">
      <a class="navbar-brand fw-bold text-white" routerLink="/dashboard" aria-label="Aurora Weather Home">
        <i class="bi bi-cloud-sun-fill text-warning me-2"></i>
        Aurora Weather
      </a>
      <button
        class="navbar-toggler text-white"
        type="button"
        [attr.aria-expanded]="menuOpen()"
        aria-controls="navMenu"
        aria-label="Toggle navigation"
        (click)="toggleMenu()">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" [class.show]="menuOpen()" id="navMenu">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/dashboard">Dashboard</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/current">Current</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/forecast">Forecast</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/search">Search</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/saved">Saved</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/maps">Maps</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/alerts">Alerts</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/history">History</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/settings">Settings</a></li>
          <li class="nav-item" routerLinkActive="active"><a class="nav-link" routerLink="/about">About</a></li>
        </ul>

        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="position-relative quick-search">
            <input
              [formControl]="searchControl"
              type="search"
              class="form-control form-control-sm bg-dark text-white border-secondary"
              placeholder="Quick search city..."
            />
            <div class="dropdown-menu show w-100" *ngIf="suggestions.length && searchControl.value">
              <button
                class="dropdown-item"
                *ngFor="let suggestion of suggestions"
                (click)="selectSuggestion(suggestion)"
              >
                {{ suggestion.name }} <small class="text-muted">{{ suggestion.country }}</small>
              </button>
            </div>
          </div>

          <button class="btn btn-sm btn-outline-light" (click)="toggleTheme()">
            <i class="bi" [ngClass]="theme === 'dark' ? 'bi-moon-stars' : 'bi-sun'"></i>
          </button>
          <button class="btn btn-sm btn-primary" (click)="refresh()">Refresh</button>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      nav {
        background: rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
      }
      .nav-link {
        color: var(--muted);
      }
      .nav-link.active,
      .nav-link:hover {
        color: var(--accent);
      }
      .quick-search .dropdown-menu {
        position: absolute;
        inset: auto auto auto 0;
        transform: translateY(2px);
        max-height: 280px;
        overflow-y: auto;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  private readonly api = inject(WeatherApiService);
  private readonly weather = inject(WeatherStateService);
  private readonly preferences = inject(PreferencesService);
  private readonly locations = inject(LocationService);

  searchControl = new FormControl('');
  suggestions: LocationSummary[] = [];
  theme = this.preferences.preferences().theme;
  readonly menuOpen = signal(false);

  ngOnInit(): void {
    this.searchControl.valueChanges
      ?.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((q) => this.api.searchLocations(q ?? ''))
      )
      .subscribe((results) => (this.suggestions = results));
  }

  selectSuggestion(loc: LocationSummary) {
    this.locations.addRecent(loc.name);
    this.weather.setLocation(loc.name);
    this.suggestions = [];
    this.searchControl.setValue('');
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.preferences.update({ theme: this.theme });
  }

  refresh() {
    this.weather.reload();
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }
}

