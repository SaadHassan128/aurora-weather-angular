import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Mood = 'clear' | 'clouds' | 'rain' | 'night';

@Injectable({ providedIn: 'root' })
export class MoodService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Pure mapping: condition text + day flag -> mood. */
  moodFor(condition: string | undefined | null, isDay: boolean): Mood {
    if (!isDay) return 'night';
    const c = (condition ?? '').toLowerCase();
    if (/(rain|drizzle|thunder|storm|shower)/.test(c)) return 'rain';
    if (/(sun|clear)/.test(c)) return 'clear';
    return 'clouds';
  }

  /** Side-effecting: set data-mood on <html> (browser only). */
  apply(condition: string | undefined | null, isDay: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-mood', this.moodFor(condition, isDay));
  }
}
