import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherStateService } from '../../core/services/weather-state.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card p-3">
      <div class="section-title">
        <i class="bi bi-globe-americas"></i>
        <span>Weather map</span>
      </div>
      <div #map class="map-container rounded-4 overflow-hidden"></div>
      <div class="text-muted small mt-2">Powered by OpenStreetMap tiles.</div>
    </div>
  `,
  styles: [
    `
      .map-container {
        height: 420px;
        width: 100%;
      }
    `
  ]
})
export class MapsComponent implements AfterViewInit {
  private readonly state = inject(WeatherStateService);
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  map?: L.Map;

  ngAfterViewInit(): void {
    const loc = this.state.currentWeather()?.location;
    const lat = loc?.lat ?? 51.5072;
    const lon = loc?.lon ?? -0.1276;

    this.map = L.map(this.mapElement.nativeElement).setView([lat, lon], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    L.marker([lat, lon]).addTo(this.map);
  }
}

