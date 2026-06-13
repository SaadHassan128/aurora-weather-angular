import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferencesService } from '../../core/services/preferences.service';
import { PreferenceState } from '../../core/models/weather.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-grid">
      <section class="card p-4" appReveal [appReveal]="0">
        <div class="section-title">
          <i class="bi bi-rulers"></i>
          <span>Units</span>
        </div>
        <p class="text-muted setting-help">Choose the measurement units used across forecasts and details.</p>

        <div class="setting-row">
          <span class="text-label" id="lbl-temperature">Temperature</span>
          <div class="segmented" role="group" aria-labelledby="lbl-temperature">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().temperature === 'c'" [attr.aria-pressed]="prefs.preferences().temperature === 'c'" (click)="update({ temperature: 'c' })">Celsius</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().temperature === 'f'" [attr.aria-pressed]="prefs.preferences().temperature === 'f'" (click)="update({ temperature: 'f' })">Fahrenheit</button>
          </div>
        </div>

        <div class="setting-row">
          <span class="text-label" id="lbl-wind">Wind speed</span>
          <div class="segmented" role="group" aria-labelledby="lbl-wind">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().wind === 'kph'" [attr.aria-pressed]="prefs.preferences().wind === 'kph'" (click)="update({ wind: 'kph' })">kph</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().wind === 'mph'" [attr.aria-pressed]="prefs.preferences().wind === 'mph'" (click)="update({ wind: 'mph' })">mph</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().wind === 'ms'" [attr.aria-pressed]="prefs.preferences().wind === 'ms'" (click)="update({ wind: 'ms' })">m/s</button>
          </div>
        </div>

        <div class="setting-row">
          <span class="text-label" id="lbl-pressure">Pressure</span>
          <div class="segmented" role="group" aria-labelledby="lbl-pressure">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().pressure === 'mb'" [attr.aria-pressed]="prefs.preferences().pressure === 'mb'" (click)="update({ pressure: 'mb' })">mb</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().pressure === 'inhg'" [attr.aria-pressed]="prefs.preferences().pressure === 'inhg'" (click)="update({ pressure: 'inhg' })">inHg</button>
          </div>
        </div>

        <div class="setting-row">
          <span class="text-label" id="lbl-precip">Precipitation</span>
          <div class="segmented" role="group" aria-labelledby="lbl-precip">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().precipitation === 'mm'" [attr.aria-pressed]="prefs.preferences().precipitation === 'mm'" (click)="update({ precipitation: 'mm' })">mm</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().precipitation === 'in'" [attr.aria-pressed]="prefs.preferences().precipitation === 'in'" (click)="update({ precipitation: 'in' })">in</button>
          </div>
        </div>

        <div class="setting-row">
          <span class="text-label" id="lbl-time">Time format</span>
          <div class="segmented" role="group" aria-labelledby="lbl-time">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().timeFormat === '12h'" [attr.aria-pressed]="prefs.preferences().timeFormat === '12h'" (click)="update({ timeFormat: '12h' })">12-hour</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().timeFormat === '24h'" [attr.aria-pressed]="prefs.preferences().timeFormat === '24h'" (click)="update({ timeFormat: '24h' })">24-hour</button>
          </div>
        </div>
      </section>

      <section class="card p-4" appReveal [appReveal]="1">
        <div class="section-title">
          <i class="bi bi-palette"></i>
          <span>Appearance</span>
        </div>
        <p class="text-muted setting-help">Auto follows your system theme; pick Light or Dark to override it.</p>

        <div class="setting-row">
          <span class="text-label" id="lbl-theme">Theme</span>
          <div class="segmented" role="group" aria-labelledby="lbl-theme">
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().theme === 'auto'" [attr.aria-pressed]="prefs.preferences().theme === 'auto'" (click)="update({ theme: 'auto' })">Auto</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().theme === 'light'" [attr.aria-pressed]="prefs.preferences().theme === 'light'" (click)="update({ theme: 'light' })">Light</button>
            <button type="button" class="seg-btn" [class.active]="prefs.preferences().theme === 'dark'" [attr.aria-pressed]="prefs.preferences().theme === 'dark'" (click)="update({ theme: 'dark' })">Dark</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      gap: 1.25rem;
    }
    .setting-help {
      margin: -0.25rem 0 1rem;
      font-size: 0.9rem;
    }
    .setting-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0;
      border-top: 1px solid var(--border);
    }
    .setting-row:first-of-type {
      border-top: none;
    }
    .setting-row .text-label {
      margin: 0;
    }
    .segmented {
      display: inline-flex;
      padding: 3px;
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      background: var(--surface-2);
    }
    .seg-btn {
      appearance: none;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      line-height: 1;
      padding: 0.5rem 0.95rem;
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .seg-btn:hover {
      color: var(--text);
    }
    .seg-btn.active {
      background: var(--accent);
      color: var(--accent-contrast);
    }
    .seg-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `]
})
export class SettingsComponent {
  readonly prefs = inject(PreferencesService);

  update(patch: Partial<PreferenceState>) {
    this.prefs.update(patch);
  }
}
