import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/layout/header.component';
import { WeatherPanelComponent } from './shared/panel/weather-panel.component';
import { PreferencesService } from './core/services/preferences.service';
import { WeatherStateService } from './core/services/weather-state.service';

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

  ngOnInit(): void {
    this.preferences.update({ theme: this.preferences.preferences().theme });
    this.weather.init();
  }
}
