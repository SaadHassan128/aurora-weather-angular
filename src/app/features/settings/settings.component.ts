import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferencesService } from '../../core/services/preferences.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-4">
      <div class="section-title">
        <i class="bi bi-sliders"></i>
        <span>Preferences</span>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label text-muted">Temperature</label>
          <div class="btn-group w-100">
            <button class="btn btn-outline-light" [class.active]="prefs.preferences().temperature === 'c'" (click)="update({ temperature: 'c' })">Celsius</button>
            <button class="btn btn-outline-light" [class.active]="prefs.preferences().temperature === 'f'" (click)="update({ temperature: 'f' })">Fahrenheit</button>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label text-muted">Theme</label>
          <div class="btn-group w-100">
            <button class="btn btn-outline-light" [class.active]="prefs.preferences().theme === 'auto'" (click)="update({ theme: 'auto' })">Auto</button>
            <button class="btn btn-outline-light" [class.active]="prefs.preferences().theme === 'light'" (click)="update({ theme: 'light' })">Light</button>
            <button class="btn btn-outline-light" [class.active]="prefs.preferences().theme === 'dark'" (click)="update({ theme: 'dark' })">Dark</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  readonly prefs = inject(PreferencesService);

  update(patch: any) {
    this.prefs.update(patch);
  }
}

