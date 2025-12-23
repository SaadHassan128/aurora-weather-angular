import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of, tap, throwError, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CurrentWeather,
  ForecastBundle,
  ForecastDay,
  LocationSummary,
  WeatherAlert,
} from '../models/weather.models';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);

  searchLocations(query: string): Observable<LocationSummary[]> {
    if (!query.trim()) return of<LocationSummary[]>([]);
    const key = `search:${query.toLowerCase()}`;
    const cached = this.cache.get<LocationSummary[]>(key);
    if (cached) return of(cached);
    const params = new HttpParams().set('q', query).set('format', 'json').set('limit', 5);
    return this.http
      .get<any[]>(`${environment.geocodeBaseUrl}/search`, {
        params,
        headers: { 'Accept-Language': 'en', 'User-Agent': 'aurora-weather-app' },
      })
      .pipe(
        map((items) =>
          (items ?? []).map((item) => ({
            name: item.display_name,
            country: item.address?.country,
            region: item.address?.state || item.address?.county,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            tzId: item?.addresstype,
          }))
        ),
        tap((list) => this.cache.set(key, list, 120)),
        catchError((err) => throwError(() => err))
      );
  }

  getCurrent(location: string) {
    const coords = this.extractCoords(location);
    if (!coords) return of(null);
    const { lat, lon } = coords;
    const key = `current:${lat},${lon}`;
    const cached = this.cache.get<CurrentWeather>(key);
    if (cached) return of(cached);
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lon)
      .set(
        'params',
        'airTemperature,windSpeed,humidity,pressure,cloudCover,visibility,precipitation,uvIndex'
      );
    return this.http.get<any>(`${environment.weatherApiBaseUrl}/weather/point`, { params }).pipe(
      map((resp) => this.mapCurrentFromStormglass(resp, lat, lon)),
      catchError(() => {
        // Return mock data when API fails
        const mockData = this.generateMockCurrent(lat, lon);
        this.cache.set(key, mockData);
        return of(mockData);
      }),
      tap((data) => data && this.cache.set(key, data))
    );
  }

  getForecast(location: string, days = 7, hours = 48) {
    const coords = this.extractCoords(location);
    if (!coords) return of(null);
    const { lat, lon } = coords;
    const key = `forecast:${lat},${lon}:${days}`;
    const cached = this.cache.get<ForecastBundle>(key);
    if (cached) return of(cached);
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lon)
      .set(
        'params',
        'airTemperature,windSpeed,humidity,pressure,cloudCover,visibility,precipitation,uvIndex'
      )
      .set('source', 'sg');
    return this.http.get<any>(`${environment.weatherApiBaseUrl}/weather/point`, { params }).pipe(
      map((resp) => this.mapForecastFromStormglass(resp, hours, lat, lon)),
      catchError(() => {
        // Return mock data when API fails
        const mockData = this.generateMockForecast(lat, lon, days, hours);
        this.cache.set(key, mockData);
        return of(mockData);
      }),
      tap((bundle) => bundle && this.cache.set(key, bundle))
    );
  }

  getHistory(location: string, date: string) {
    const coords = this.extractCoords(location);
    if (!coords) return of(null);
    const { lat, lon } = coords;
    const key = `history:${lat},${lon}:${date}`;
    const cached = this.cache.get<ForecastDay>(key);
    if (cached) return of(cached);
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lon)
      .set('start', `${date}T00:00:00+00:00`)
      .set('end', `${date}T23:59:59+00:00`)
      .set('params', 'airTemperature,windSpeed,humidity,pressure,cloudCover,precipitation');
    return this.http.get<any>(`${environment.weatherApiBaseUrl}/weather/point`, { params }).pipe(
      map((resp) => this.mapHistoryFromStormglass(resp)),
      tap((day) => day && this.cache.set(key, day, 60)),
      catchError(() => of(null))
    );
  }

  private extractCoords(input: string): { lat: string; lon: string } | null {
    const parts = input.split(',').map((p) => p.trim());
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
      return { lat: parts[0], lon: parts[1] };
    }
    return null;
  }

  private mapCurrentFromStormglass(resp: any, lat: string, lon: string): CurrentWeather | null {
    const hour = resp?.hours?.[0];
    if (!hour) return null;
    return {
      location: { name: `${lat},${lon}`, lat: parseFloat(lat), lon: parseFloat(lon) },
      tempC: hour.airTemperature?.sg ?? 0,
      tempF: hour.airTemperature?.sg != null ? hour.airTemperature.sg * 1.8 + 32 : 0,
      feelslikeC: hour.airTemperature?.sg ?? 0,
      feelslikeF: hour.airTemperature?.sg != null ? hour.airTemperature.sg * 1.8 + 32 : 0,
      humidity: hour.humidity?.sg ?? 0,
      windKph: hour.windSpeed?.sg != null ? hour.windSpeed.sg * 3.6 : 0,
      windMph: hour.windSpeed?.sg != null ? hour.windSpeed.sg * 2.23694 : 0,
      windDir: '', // Stormglass Basic doesn’t include wind direction in this minimal set; can be added if needed
      pressureMb: hour.pressure?.sg ?? 0,
      pressureIn: hour.pressure?.sg != null ? hour.pressure.sg * 0.02953 : 0,
      cloud: hour.cloudCover?.sg ?? 0,
      visKm: hour.visibility?.sg ?? 0,
      visMiles: hour.visibility?.sg != null ? hour.visibility.sg * 0.621371 : 0,
      uv: hour.uvIndex?.sg ?? 0,
      precipMm: hour.precipitation?.sg ?? 0,
      precipIn: hour.precipitation?.sg != null ? hour.precipitation.sg / 25.4 : 0,
      airQuality: undefined,
      condition: { text: 'Weather data', icon: '', code: undefined },
      isDay: true,
      lastUpdated: hour.time,
    };
  }

  private mapForecastFromStormglass(
    resp: any,
    hours: number,
    lat: string,
    lon: string
  ): ForecastBundle | null {
    const list = resp?.hours ?? [];
    if (!list.length) return null;

    // Build day buckets from hourly data
    const byDay: Record<string, any[]> = {};
    list.slice(0, hours).forEach((h: any) => {
      const day = h.time?.split('T')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(h);
    });

    const days: ForecastDay[] = Object.entries(byDay).map(([date, bucket]) => {
      const temps = bucket.map((h: any) => h.airTemperature?.sg ?? 0);
      const maxtempC = Math.max(...temps);
      const mintempC = Math.min(...temps);
      return {
        date,
        sunrise: '',
        sunset: '',
        maxtempC,
        maxtempF: maxtempC * 1.8 + 32,
        mintempC,
        mintempF: mintempC * 1.8 + 32,
        avgtempC: temps.reduce((a, b) => a + b, 0) / (temps.length || 1),
        avgtempF: (temps.reduce((a, b) => a + b, 0) / (temps.length || 1)) * 1.8 + 32,
        maxwindKph: Math.max(...bucket.map((h: any) => (h.windSpeed?.sg ?? 0) * 3.6)),
        maxwindMph: Math.max(...bucket.map((h: any) => (h.windSpeed?.sg ?? 0) * 2.23694)),
        totalprecipMm: bucket.reduce((a: number, h: any) => a + (h.precipitation?.sg ?? 0), 0),
        totalprecipIn:
          bucket.reduce((a: number, h: any) => a + (h.precipitation?.sg ?? 0), 0) / 25.4,
        avghumidity:
          bucket.reduce((a: number, h: any) => a + (h.humidity?.sg ?? 0), 0) / (bucket.length || 1),
        dailyWillItRain: 0,
        dailyChanceOfRain: 0,
        condition: { text: 'Forecast', icon: '', code: undefined },
        uv: bucket[0]?.uvIndex?.sg ?? 0,
        hours: bucket.map((hour: any) => ({
          time: hour.time,
          tempC: hour.airTemperature?.sg ?? 0,
          tempF: hour.airTemperature?.sg != null ? hour.airTemperature.sg * 1.8 + 32 : 0,
          feelslikeC: hour.airTemperature?.sg ?? 0,
          feelslikeF: hour.airTemperature?.sg != null ? hour.airTemperature.sg * 1.8 + 32 : 0,
          chanceOfRain: 0,
          chanceOfSnow: 0,
          humidity: hour.humidity?.sg ?? 0,
          windKph: hour.windSpeed?.sg != null ? hour.windSpeed.sg * 3.6 : 0,
          windMph: hour.windSpeed?.sg != null ? hour.windSpeed.sg * 2.23694 : 0,
          windDir: '',
          pressureMb: hour.pressure?.sg ?? 0,
          pressureIn: hour.pressure?.sg != null ? hour.pressure.sg * 0.02953 : 0,
          condition: { text: 'Forecast', icon: '', code: undefined },
          gustKph: 0,
          gustMph: 0,
          uv: hour.uvIndex?.sg ?? 0,
          willItRain: 0,
          willItSnow: 0,
        })),
      };
    });

    const location = { name: 'Selected location', lat: parseFloat(lat), lon: parseFloat(lon) };

    return {
      location,
      current: this.mapCurrentFromStormglass(
        { hours: list },
        String(location.lat),
        String(location.lon)
      )!,
      days,
      alerts: [],
    };
  }

  private mapHistoryFromStormglass(resp: any): ForecastDay | null {
    const list = resp?.hours ?? [];
    if (!list.length) return null;
    const temps = list.map((h: any) => h.airTemperature?.sg ?? 0);
    const maxtempC = Math.max(...temps);
    const mintempC = Math.min(...temps);
    const date = list[0].time?.split('T')[0];
    return {
      date,
      sunrise: '',
      sunset: '',
      maxtempC,
      maxtempF: maxtempC * 1.8 + 32,
      mintempC,
      mintempF: mintempC * 1.8 + 32,
      avgtempC: temps.reduce((a: number, b: number) => a + b, 0) / (temps.length || 1),
      avgtempF: (temps.reduce((a: number, b: number) => a + b, 0) / (temps.length || 1)) * 1.8 + 32,
      maxwindKph: Math.max(...list.map((h: any) => (h.windSpeed?.sg ?? 0) * 3.6)),
      maxwindMph: Math.max(...list.map((h: any) => (h.windSpeed?.sg ?? 0) * 2.23694)),
      totalprecipMm: list.reduce((a: number, h: any) => a + (h.precipitation?.sg ?? 0), 0),
      totalprecipIn: list.reduce((a: number, h: any) => a + (h.precipitation?.sg ?? 0), 0) / 25.4,
      avghumidity:
        list.reduce((a: number, h: any) => a + (h.humidity?.sg ?? 0), 0) / (list.length || 1),
      dailyWillItRain: 0,
      dailyChanceOfRain: 0,
      condition: { text: 'History', icon: '', code: undefined },
      uv: list[0]?.uvIndex?.sg ?? null,
      hours: list,
    };
  }

  private generateMockCurrent(lat: string, lon: string): CurrentWeather {
    const hour = Math.floor(Math.random() * 24);
    const baseTemp = 15 + Math.sin((hour / 24) * Math.PI * 2) * 5;
    const temp = baseTemp + (Math.random() - 0.5) * 3;
    return {
      location: {
        name: 'Current Location',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        country: 'Demo',
      },
      tempC: Math.round(temp * 10) / 10,
      tempF: Math.round((temp * 1.8 + 32) * 10) / 10,
      feelslikeC: Math.round((temp - 2) * 10) / 10,
      feelslikeF: Math.round(((temp - 2) * 1.8 + 32) * 10) / 10,
      humidity: 60 + Math.floor(Math.random() * 30),
      windKph: 10 + Math.floor(Math.random() * 20),
      windMph: 6 + Math.floor(Math.random() * 12),
      windDir: 'SW',
      pressureMb: 1013,
      pressureIn: 29.92,
      cloud: 40 + Math.floor(Math.random() * 40),
      visKm: 10,
      visMiles: 6.2,
      uv: Math.floor(Math.random() * 8),
      precipMm: Math.floor(Math.random() * 2),
      precipIn: Math.floor(Math.random() * 0.1),
      airQuality: undefined,
      condition: {
        text: 'Partly Cloudy',
        icon: 'https://cdn.weatherapi.com/weather/128x128/day/116.png',
        code: 1003,
      },
      isDay: hour >= 6 && hour < 18,
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateMockForecast(
    lat: string,
    lon: string,
    days: number,
    hours: number
  ): ForecastBundle {
    const now = new Date();
    const hourlyData = [];

    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() + i * 3600000);
      const hour = time.getHours();
      const baseTemp = 15 + Math.sin((hour / 24) * Math.PI * 2) * 5;
      const temp = baseTemp + (Math.random() - 0.5) * 2;
      const windKph = 10 + Math.floor(Math.random() * 15);

      hourlyData.push({
        time: time.toISOString(),
        tempC: Math.round(temp * 10) / 10,
        tempF: Math.round((temp * 1.8 + 32) * 10) / 10,
        feelslikeC: Math.round((temp - 1) * 10) / 10,
        feelslikeF: Math.round(((temp - 1) * 1.8 + 32) * 10) / 10,
        chanceOfRain: Math.floor(Math.random() * 40),
        chanceOfSnow: 0,
        humidity: 60 + Math.floor(Math.random() * 30),
        windKph: windKph,
        windMph: Math.round(windKph * 0.621371),
        windDir: 'SW',
        pressureMb: 1013,
        pressureIn: 29.92,
        condition: {
          text: 'Partly Cloudy',
          icon: 'https://cdn.weatherapi.com/weather/128x128/day/116.png',
          code: 1003,
        },
        gustKph: windKph + 5,
        gustMph: Math.round((windKph + 5) * 0.621371),
        uv: Math.floor(Math.random() * 6),
        willItRain: Math.random() > 0.7 ? 1 : 0,
        willItSnow: 0,
      });
    }

    // Group into days
    const daysList = [];
    for (let d = 0; d < days; d++) {
      const dayDate = new Date(now.getTime() + d * 86400000);
      const dayHours = hourlyData.filter((h) => {
        const hDate = new Date(h.time);
        return hDate.toDateString() === dayDate.toDateString();
      });

      if (dayHours.length > 0) {
        const temps = dayHours.map((h) => h.tempC);
        const winds = dayHours.map((h) => h.windKph);
        const precip = dayHours.reduce((a, h) => a + h.willItRain * Math.random(), 0);
        const humidity = dayHours.map((h) => h.humidity);

        daysList.push({
          date: dayDate.toISOString().split('T')[0],
          maxtempC: Math.max(...temps),
          maxtempF: Math.max(...temps) * 1.8 + 32,
          mintempC: Math.min(...temps),
          mintempF: Math.min(...temps) * 1.8 + 32,
          avgtempC: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
          avgtempF:
            Math.round(((temps.reduce((a, b) => a + b, 0) / temps.length) * 1.8 + 32) * 10) / 10,
          maxwindKph: Math.max(...winds),
          maxwindMph: Math.round(Math.max(...winds) * 0.621371),
          totalprecipMm: Math.round(precip * 10) / 10,
          totalprecipIn: Math.round((precip * 10) / 25.4) / 10,
          avghumidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
          dailyWillItRain: precip > 0 ? 1 : 0,
          dailyChanceOfRain: Math.floor(Math.random() * 30),
          condition: {
            text: 'Partly Cloudy',
            icon: 'https://cdn.weatherapi.com/weather/128x128/day/116.png',
            code: 1003,
          },
          uv: 5,
          sunrise: '07:00',
          sunset: '17:00',
          hours: dayHours.length > 0 ? dayHours : [],
        });
      }
    }

    return {
      location: {
        name: 'Current Location',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        country: 'Demo',
      },
      current: this.generateMockCurrent(lat, lon),
      days: daysList,
      alerts: [],
    };
  }
}
