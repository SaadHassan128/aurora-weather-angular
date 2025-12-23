import { Injectable, signal, inject } from '@angular/core';
import { SavedLocation, RecentSearch } from '../models/weather.models';
import { StorageService } from './storage.service';

const SAVED_KEY = 'weather:saved-locations';
const RECENT_KEY = 'weather:recent-searches';
const HISTORY_KEY = 'weather:location-history';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly storage = inject(StorageService);
  saved = signal<SavedLocation[]>(this.storage.get(SAVED_KEY, []));
  recent = signal<RecentSearch[]>(this.storage.get(RECENT_KEY, []));
  history = signal<{ type: string; query: string; at: number }[]>(
    this.storage.get(HISTORY_KEY, [])
  );

  addRecent(query: string) {
    const next = [{ query, at: Date.now() }, ...this.recent()]
      .filter((item, idx, arr) => arr.findIndex((r) => r.query === item.query) === idx)
      .slice(0, 15);
    this.recent.set(next);
    this.storage.set(RECENT_KEY, next);
    this.recordAction('search', query);
  }

  upsertLocation(location: SavedLocation) {
    const existing = this.saved().filter(
      (l) => l.name !== location.name || l.country !== location.country
    );
    const next = [...existing, location];
    this.saved.set(next);
    this.storage.set(SAVED_KEY, next);
    this.recordAction('save', location.name);
  }

  recordAction(type: 'search' | 'view' | 'save', query: string) {
    const next = [{ type, query, at: Date.now() }, ...this.history()].slice(0, 50);
    this.history.set(next);
    this.storage.set(HISTORY_KEY, next);
  }

  removeAllHistory() {
    this.history.set([]);
    this.storage.set(HISTORY_KEY, []);
  }

  removeLocation(name: string) {
    const next = this.saved().filter((l) => l.name !== name);
    this.saved.set(next);
    this.storage.set(SAVED_KEY, next);
  }

  setDefault(name: string) {
    const next = this.saved().map((loc) => ({ ...loc, default: loc.name === name }));
    this.saved.set(next);
    this.storage.set(SAVED_KEY, next);
  }

  reorder(from: number, to: number) {
    const list = [...this.saved()];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    this.saved.set(list);
    this.storage.set(SAVED_KEY, list);
  }
}
