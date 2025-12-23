export interface LocationSummary {
  id?: string;
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lon: number;
  tzId?: string;
}

export interface Condition {
  text: string;
  icon: string;
  code?: number;
}

export interface CurrentWeather {
  location: LocationSummary;
  tempC: number;
  tempF: number;
  feelslikeC: number;
  feelslikeF: number;
  humidity: number;
  windKph: number;
  windMph: number;
  windDir: string;
  pressureMb: number;
  pressureIn: number;
  cloud: number;
  visKm: number;
  visMiles: number;
  uv: number;
  precipMm: number;
  precipIn: number;
  airQuality?: AirQuality;
  condition: Condition;
  isDay: boolean;
  lastUpdated: string;
}

export interface ForecastHour {
  time: string;
  tempC: number;
  tempF: number;
  feelslikeC: number;
  feelslikeF: number;
  chanceOfRain: number;
  chanceOfSnow: number;
  humidity: number;
  windKph: number;
  windMph: number;
  windDir: string;
  pressureMb: number;
  pressureIn: number;
  condition: Condition;
  gustKph: number;
  gustMph: number;
  uv: number;
  willItRain: number;
  willItSnow: number;
}

export interface ForecastDay {
  date: string;
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  maxtempC: number;
  maxtempF: number;
  mintempC: number;
  mintempF: number;
  avgtempC: number;
  avgtempF: number;
  maxwindKph: number;
  maxwindMph: number;
  totalprecipMm: number;
  totalprecipIn: number;
  avghumidity: number;
  dailyWillItRain: number;
  dailyChanceOfRain: number;
  condition: Condition;
  uv: number;
  hours: ForecastHour[];
}

export interface ForecastBundle {
  location: LocationSummary;
  current: CurrentWeather;
  days: ForecastDay[];
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  headline: string;
  severity: string;
  areas: string;
  category: string;
  certainty?: string;
  event: string;
  effective: string;
  expires: string;
  desc: string;
  instruction?: string;
}

export interface AirQuality {
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  usEpaIndex?: number;
  gbDefraIndex?: number;
}

export interface PreferenceState {
  temperature: 'c' | 'f';
  wind: 'kph' | 'mph' | 'ms';
  pressure: 'mb' | 'inhg';
  precipitation: 'mm' | 'in';
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
}

export interface CachedResponse<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export interface RecentSearch {
  query: string;
  at: number;
}

export interface SavedLocation extends LocationSummary {
  default?: boolean;
}


