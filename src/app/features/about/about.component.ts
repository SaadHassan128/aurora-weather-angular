import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about-page">
      <section class="card p-4" [appReveal]="0">
        <p class="text-label">ABOUT</p>
        <h1 class="about-title">Aurora <span class="accent">Weather</span></h1>
        <p class="about-tagline">The weather, told clearly — with an interface that shifts to match the sky.</p>
        <p class="text-muted about-body">
          Aurora Weather is a modern Angular weather dashboard with real-time conditions, forecasts,
          interactive maps, and alerts. Its adaptive interface shifts its accent colour with the
          weather, supports light and dark themes, and remembers your saved locations and recent history.
        </p>
      </section>

      <section class="card p-4" [appReveal]="1">
        <p class="text-label">FEATURES</p>
        <ul class="feature-list">
          <li><span class="pill">Adaptive weather-driven theming</span></li>
          <li><span class="pill">7-day &amp; hourly forecasts</span></li>
          <li><span class="pill">Interactive map</span></li>
          <li><span class="pill">Severity-coded alerts</span></li>
          <li><span class="pill">Saved locations &amp; history</span></li>
          <li><span class="pill">Light / dark themes</span></li>
        </ul>
      </section>

      <section class="card p-4" [appReveal]="2">
        <p class="text-label">BUILT WITH</p>
        <p class="text-muted about-credits">
          Built with Angular, Chart.js, Leaflet. Weather data via Stormglass; geocoding via
          OpenStreetMap Nominatim.
        </p>
        <div class="about-cta">
          <a class="btn-accent" routerLink="/dashboard">Open the dashboard</a>
          <a class="btn-outline-accent" routerLink="/search">Search a city</a>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .about-page {
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .about-title {
        font-size: clamp(2rem, 5vw, 2.75rem);
        font-weight: 700;
        line-height: 1.1;
        margin: 0.25rem 0 0.75rem;
        color: var(--text);
      }
      .about-title .accent {
        color: var(--accent);
      }
      .about-tagline {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--text);
        margin: 0 0 0.75rem;
      }
      .about-body {
        margin: 0;
      }
      .feature-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .about-credits {
        margin: 0.25rem 0 1.25rem;
      }
      .about-cta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
    `,
  ],
})
export class AboutComponent {}
