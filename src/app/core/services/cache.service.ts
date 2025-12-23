import { Injectable } from '@angular/core';
import { CachedResponse } from '../models/weather.models';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CacheService {
  constructor(private storage: StorageService) {}

  get<T>(key: string): T | null {
    const cached = this.storage.get<CachedResponse<T> | null>(`cache:${key}`, null);
    if (!cached) return null;
    const isExpired = Date.now() - cached.cachedAt > cached.ttlMs;
    if (isExpired) {
      this.storage.remove(`cache:${key}`);
      return null;
    }
    return cached.data;
  }

  set<T>(key: string, value: T, ttlMinutes = environment.cacheTtlMinutes): void {
    const ttlMs = ttlMinutes * 60 * 1000;
    const payload: CachedResponse<T> = {
      data: value,
      cachedAt: Date.now(),
      ttlMs
    };
    this.storage.set(`cache:${key}`, payload);
  }
}


