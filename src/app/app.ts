import { Component, OnInit, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/layout/header.component';
import { WeatherPanelComponent } from './shared/panel/weather-panel.component';
import { PreferencesService } from './core/services/preferences.service';
import { WeatherStateService } from './core/services/weather-state.service';
import { MoodService } from './core/services/mood.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, WeatherPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private readonly preferences = inject(PreferencesService);
  protected readonly weather = inject(WeatherStateService);
  private readonly mood = inject(MoodService);

  constructor() {
    effect(() => {
      const cur = this.weather.currentWeather();
      if (cur) this.mood.apply(cur.condition?.text, cur.isDay);
    });
  }

  ngOnInit(): void {
    this.preferences.update({ theme: this.preferences.preferences().theme });
    this.weather.init();
  }
}
