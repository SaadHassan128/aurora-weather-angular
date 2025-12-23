import { Injectable } from '@angular/core';
import { PreferenceState } from '../models/weather.models';

@Injectable({ providedIn: 'root' })
export class UnitConversionService {
  toTemperature(valueC: number, preferences: PreferenceState): number {
    return preferences.temperature === 'c' ? valueC : valueC * 1.8 + 32;
  }

  toWind(kph: number, preferences: PreferenceState): number {
    switch (preferences.wind) {
      case 'mph':
        return kph * 0.621371;
      case 'ms':
        return kph / 3.6;
      default:
        return kph;
    }
  }

  toPressure(mb: number, preferences: PreferenceState): number {
    return preferences.pressure === 'inhg' ? mb * 0.02953 : mb;
  }

  toPrecip(mm: number, preferences: PreferenceState): number {
    return preferences.precipitation === 'in' ? mm / 25.4 : mm;
  }
}


