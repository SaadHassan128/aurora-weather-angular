import { AfterViewInit, Component, ElementRef, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  template: `
    <div class="card p-3" appReveal>
      <h2 class="section-title">
        <i class="bi bi-globe-americas" aria-hidden="true"></i>
        <span>Weather map</span>
      </h2>
      <div #map class="map-container"></div>
      <div class="text-label mt-2">Powered by OpenStreetMap tiles.</div>
    </div>
  `,
  styles: [
    `
      .map-container {
        height: 420px;
        width: 100%;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        overflow: hidden;
      }

      :host ::ng-deep .leaflet-control-zoom a {
        background: var(--surface-2);
        color: var(--text);
        border-color: var(--border);
      }
      :host ::ng-deep .leaflet-control-zoom a:hover {
        background: var(--accent);
        color: var(--accent-contrast);
      }
      :host ::ng-deep .leaflet-bar {
        border-color: var(--border);
      }
      :host ::ng-deep .leaflet-control-attribution {
        background: color-mix(in srgb, var(--surface) 80%, transparent);
        color: var(--text-muted);
      }
      :host ::ng-deep .leaflet-control-attribution a {
        color: var(--accent);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapsComponent implements AfterViewInit {
  private readonly state = inject(WeatherStateService);
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  map?: any;

  ngAfterViewInit(): void {
    const loc = this.state.currentWeather()?.location;
    const lat = loc?.lat ?? 51.5072;
    const lon = loc?.lon ?? -0.1276;

    import('leaflet').then((L) => {
      this.map = L.map(this.mapElement.nativeElement).setView([lat, lon], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      L.marker([lat, lon]).addTo(this.map);
    });
  }
}
