import { Component, inject, OnInit, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
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
    <nav class="aurora-nav" [class.shrink]="scrolled()" aria-label="Primary">
      <div class="nav-inner">
        <a class="brand" routerLink="/dashboard" aria-label="Aurora Weather Home">
          <i class="bi bi-cloud-sun-fill"></i> <span>Aurora</span>
        </a>

        <button
          class="nav-toggle"
          type="button"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="navMenu"
          aria-label="Toggle navigation"
          (click)="toggleMenu()"
        >
          <i class="bi" [ngClass]="menuOpen() ? 'bi-x-lg' : 'bi-list'"></i>
        </button>

        <div class="nav-links" id="navMenu" [class.open]="menuOpen()">
          <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Dashboard</a>
          <a routerLink="/current" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Current</a>
          <a routerLink="/forecast" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Forecast</a>
          <a routerLink="/maps" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Maps</a>

          <div class="more" [class.open]="moreOpen()">
            <button type="button" class="more-btn" [attr.aria-expanded]="moreOpen()" (click)="toggleMore()">
              More <i class="bi bi-chevron-down"></i>
            </button>
            <div class="more-menu" role="menu">
              <a routerLink="/search" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Search</a>
              <a routerLink="/saved" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Saved</a>
              <a routerLink="/alerts" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Alerts</a>
              <a routerLink="/history" routerLinkActive="active" (click)="closeMenu()" role="menuitem">History</a>
            </div>
          </div>

          <div class="nav-right">
            <div class="quick-search">
              <input
                [formControl]="searchControl"
                type="search"
                class="qs-input"
                placeholder="Search city…"
                aria-label="Quick search city"
              />
              <div class="qs-results" *ngIf="suggestions.length && searchControl.value">
                <button type="button" *ngFor="let s of suggestions" (click)="selectSuggestion(s)">
                  {{ s.name }} <small>{{ s.country }}</small>
                </button>
              </div>
            </div>
            <button class="icon-btn" (click)="toggleTheme()" aria-label="Toggle theme">
              <i class="bi" [ngClass]="theme === 'dark' ? 'bi-moon-stars' : 'bi-sun'"></i>
            </button>
            <button class="icon-btn" (click)="refresh()" aria-label="Refresh data"><i class="bi bi-arrow-clockwise"></i></button>
            <a class="icon-btn" routerLink="/settings" routerLinkActive="active" (click)="closeMenu()" aria-label="Settings"><i class="bi bi-gear"></i></a>
            <a class="icon-btn" routerLink="/about" routerLinkActive="active" (click)="closeMenu()" aria-label="About"><i class="bi bi-info-circle"></i></a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
.aurora-nav {
  position: sticky; top: 0; z-index: 100;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition: padding 0.25s ease;
}
.nav-inner { max-width: var(--maxw); margin: 0 auto; display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.25rem; }
.aurora-nav.shrink .nav-inner { padding: 0.5rem 1.25rem; }
.brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
.brand i { color: var(--accent); }
.nav-toggle { display: none; background: none; border: none; color: var(--text); font-size: 1.4rem; min-width: 44px; min-height: 44px; }
.nav-links { display: flex; align-items: center; gap: 0.25rem; flex: 1; }
.nav-links > a { color: var(--text-muted); padding: 0.5rem 0.85rem; border-radius: var(--radius-pill); font-weight: 500; transition: color 0.2s, background 0.2s; }
.nav-links > a:hover { color: var(--text); }
.nav-links > a.active { color: var(--accent-contrast); background: var(--accent); }
.more { position: relative; }
.more-btn { background: none; border: none; color: var(--text-muted); font-weight: 500; padding: 0.5rem 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; }
.more-btn:hover { color: var(--text); }
.more-menu { display: none; position: absolute; top: 100%; left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 0.4rem; min-width: 160px; flex-direction: column; z-index: 20; }
.more.open .more-menu { display: flex; }
.more-menu a { color: var(--text-muted); padding: 0.5rem 0.75rem; border-radius: 8px; }
.more-menu a:hover, .more-menu a.active { color: var(--text); background: var(--surface-2); }
.nav-right { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
.quick-search { position: relative; }
.qs-input { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius-pill); padding: 0.4rem 0.9rem; font-size: 0.85rem; min-width: 180px; }
.qs-input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.qs-results { position: absolute; top: 110%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); max-height: 280px; overflow-y: auto; z-index: 30; }
.qs-results button { display: block; width: 100%; text-align: left; background: none; border: none; color: var(--text); padding: 0.5rem 0.75rem; }
.qs-results button:hover { background: var(--surface-2); }
.qs-results small { color: var(--text-muted); }
.icon-btn { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); width: 40px; height: 40px; min-width: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.icon-btn:hover, .icon-btn.active { color: var(--accent); border-color: var(--accent); }

@media (max-width: 991px) {
  .nav-toggle { display: inline-flex; margin-left: auto; }
  .nav-links { position: fixed; inset: 64px 0 0 auto; width: min(82vw, 320px); flex-direction: column; align-items: stretch; background: var(--surface); border-left: 1px solid var(--border); padding: 1rem; gap: 0.25rem; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); overflow-y: auto; }
  .nav-links.open { transform: translateX(0); }
  .more-menu { position: static; display: flex; box-shadow: none; border: none; padding-left: 0.5rem; }
  .nav-right { margin-left: 0; flex-wrap: wrap; }
  .qs-input { min-width: 0; width: 100%; }
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
  theme: 'dark' | 'light' =
    (typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light')) ||
    'dark';
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly moreOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    if (typeof window === 'undefined') return;
    const s = window.scrollY > 40;
    if (s !== this.scrolled()) this.scrolled.set(s);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.moreOpen() && !(e.target as HTMLElement).closest('.more')) {
      this.moreOpen.set(false);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined' && window.innerWidth >= 992 && this.menuOpen()) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.closeMenu(); this.moreOpen.set(false); }

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
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    }
  }

  toggleMore() { this.moreOpen.update((v) => !v); }

  closeMenu() {
    this.menuOpen.set(false);
    this.moreOpen.set(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
}

