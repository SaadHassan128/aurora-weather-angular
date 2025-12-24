import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-4">
      <div class="section-title">
        <i class="bi bi-info-circle"></i>
        <span>About Aurora Weather</span>
      </div>
      <p>
        Aurora Weather is a production-ready Angular experience built on WeatherAPI data with responsive
        design, caching, and offline-friendly patterns.
      </p>
      <ul class="text-muted">
        <li>Bootstrap 5 theming with glassmorphism cards</li>
        <li>Chart-driven insights and alerting</li>
        <li>Local storage persistence for preferences and saved cities</li>
      </ul>
    </div>
  `
})
export class AboutComponent {}

