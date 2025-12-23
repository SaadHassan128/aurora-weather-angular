export const environment = {
  production: true,
  weatherApiBaseUrl: 'https://api.stormglass.io/v2',
  // Runtime API key: leave empty here and provide via `src/assets/runtime-env.js` or CI secrets
  weatherApiKey: '',
  geocodeBaseUrl: 'https://nominatim.openstreetmap.org',
  cacheTtlMinutes: 20,
};
