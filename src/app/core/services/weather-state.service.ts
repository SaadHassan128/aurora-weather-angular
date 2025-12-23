import { Injectable, computed, signal } from '@angular/core';
import { WeatherApiService } from './weather-api.service';
import { ForecastBundle, CurrentWeather } from '../models/weather.models';
import { PreferencesService } from './preferences.service';
import { LocationService } from './location.service';
import { GeolocationService } from './geolocation.service';

@Injectable({ providedIn: 'root' })
export class WeatherStateService {
  readonly currentLocation = signal<string>('51.5072,-0.1276');
  readonly currentWeather = signal<CurrentWeather | null>(null);
  readonly forecast = signal<ForecastBundle | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly theme = computed(() => this.preferences.preferences().theme);

  constructor(
    private api: WeatherApiService,
    private preferences: PreferencesService,
    private locations: LocationService,
    private geo: GeolocationService
  ) {}

  init() {
    const defaultSaved = this.locations.saved().find((l) => l.default);
    if (defaultSaved) {
      this.setLocation(defaultSaved.name);
      return;
    }
    // Try geolocation but don't wait - load default immediately
    this.setLocation(this.currentLocation());
    this.geo
      .locate()
      .then((pos) => {
        if (pos) {
          const query = `${pos.coords.latitude},${pos.coords.longitude}`;
          this.setLocation(query);
        }
      })
      .catch(() => {
        // Silently fail, already loaded default
      });
  }

  setLocation(query: string) {
    this.currentLocation.set(query);
    this.loadAll();
  }

  reload() {
    this.loadAll(true);
  }

  private loadAll(force = false) {
    this.isLoading.set(true);
    this.error.set(null);
    const loc = this.currentLocation();
    const coordsMaybe = loc.includes(',') ? loc : null;

    const fetchData = (locationStr: string) => {
      this.api.getCurrent(locationStr).subscribe({
        next: (current) => {
          if (current) this.currentWeather.set(current);
        },
        error: (err) => this.error.set(err.message),
      });

      this.api.getForecast(locationStr, 7, 48).subscribe({
        next: (forecast) => {
          this.forecast.set(forecast);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.isLoading.set(false);
        },
      });
    };

    if (coordsMaybe) {
      fetchData(coordsMaybe);
    } else {
      this.api.searchLocations(loc).subscribe({
        next: (results) => {
          const first = results[0];
          if (first) {
            const coords = `${first.lat},${first.lon}`;
            this.currentLocation.set(coords);
            fetchData(coords);
          } else {
            this.isLoading.set(false);
            this.error.set('No matching location found.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.message);
        },
      });
    }
  }
}
