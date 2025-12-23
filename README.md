# Aurora Weather (Angular)

Portfolio-grade Angular 17+ weather experience powered by WeatherAPI with caching, local persistence, responsive Bootstrap UI, charts, and an always-available sliding panel.

## Setup

1. Install deps  
   `npm install`

2. Configure Stormglass API key
   There are two supported options to provide the Stormglass API key (recommended to avoid committing secrets):

- Runtime file (local development - recommended):

  - Edit `src/assets/runtime-env.js` and set `window.__env__.weatherApiKey = '<your-key>'`.
  - This file is loaded at app startup and keeps secrets out of your TypeScript sources.

- Build-time (not recommended for secrets):
  - You may set `weatherApiKey` in `src/environments/environment.ts` and `src/environments/environment.development.ts` before building, but do NOT commit keys to version control.

3. Run locally  
   `npm start` then open `http://localhost:4200`. Ensure you have set a valid Stormglass API key using one of the methods above so live weather requests succeed.

4. Production build  
   `ng build --configuration=production --optimization=true`

## Features

- WeatherAPI integration: current, 7-day forecast with alerts, history, and search/autocomplete.
- Sliding left panel accessible on every page with mini widget, saved locations, and recent searches.
- Local storage persistence for preferences (units, theme), saved locations, and cache with expiry.
- Responsive pages: Dashboard, Current, Forecast, Search, Saved, Maps (Leaflet), Alerts, History, Settings, About.
- Theming: light/dark/auto via CSS variables and smooth transitions.
- Charts: temperature trend (ng2-charts/Chart.js) and responsive cards for hourly/daily outlooks.
- Geolocation bootstrap with graceful fallback and rate-limit-aware HTTP interceptor.
- Bootstrap 5 glassmorphism styling, icons (Bootstrap Icons/FontAwesome), and mobile-friendly layout.

## Key data points surfaced

Current: temperature, feels-like, humidity, wind speed/direction, pressure, visibility, UV, precipitation, cloud cover, AQI (when available).  
Forecast: hourly temps/precip, daily highs/lows, sunrise/sunset, UV, rain chances.  
Alerts: headline, severity, effective/expiry, description.  
History: single-date snapshot with highs/lows/UV/rain.

## Notes

- Keyboard friendly: panel can be closed with Escape; quick search is debounced.
- Map uses OpenStreetMap tiles via Leaflet; requires network access.
- Remember to keep your API key private—do not commit it to version control.
