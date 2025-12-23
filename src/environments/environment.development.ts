export const environment = {
  production: false,
  weatherApiBaseUrl: 'https://api.stormglass.io/v2',
  // Runtime API key: leave empty here and provide via `src/assets/runtime-env.js` during local development
  weatherApiKey: '',
  geocodeBaseUrl: 'https://nominatim.openstreetmap.org',
  cacheTtlMinutes: 20,
};
