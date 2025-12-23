import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Weather Dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent)
  },
  {
    path: 'current',
    title: 'Current Weather',
    loadComponent: () =>
      import('./features/current/current.component').then((c) => c.CurrentComponent)
  },
  {
    path: 'forecast',
    title: 'Forecast',
    loadComponent: () =>
      import('./features/forecast/forecast.component').then((c) => c.ForecastComponent)
  },
  {
    path: 'search',
    title: 'Search Locations',
    loadComponent: () =>
      import('./features/search/search.component').then((c) => c.SearchComponent)
  },
  {
    path: 'saved',
    title: 'Saved Locations',
    loadComponent: () =>
      import('./features/saved/saved.component').then((c) => c.SavedComponent)
  },
  {
    path: 'maps',
    title: 'Weather Maps',
    loadComponent: () =>
      import('./features/maps/maps.component').then((c) => c.MapsComponent)
  },
  {
    path: 'alerts',
    title: 'Weather Alerts',
    loadComponent: () =>
      import('./features/alerts/alerts.component').then((c) => c.AlertsComponent)
  },
  {
    path: 'history',
    title: 'Historical Weather',
    loadComponent: () =>
      import('./features/history/history.component').then((c) => c.HistoryComponent)
  },
  {
    path: 'settings',
    title: 'Settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then((c) => c.SettingsComponent)
  },
  {
    path: 'about',
    title: 'About',
    loadComponent: () => import('./features/about/about.component').then((c) => c.AboutComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
