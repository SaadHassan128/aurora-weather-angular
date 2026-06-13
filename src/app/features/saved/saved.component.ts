import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocationService } from '../../core/services/location.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealDirective],
  template: `
    <div class="card p-4">
      <div class="section-title">
        <i class="bi bi-bookmark-heart"></i>
        <span>Saved locations</span>
      </div>

      <!-- Saved cards -->
      <div class="saved-grid" *ngIf="locations.saved().length">
        <div
          class="card saved-tile"
          appReveal
          [appReveal]="i"
          *ngFor="let loc of locations.saved(); let i = index; trackBy: trackByName"
        >
          <div class="saved-head">
            <div>
              <div class="saved-name">{{ loc.name }}</div>
              <div class="text-label">{{ loc.country }}</div>
            </div>
            <span class="pill saved-default" *ngIf="loc.default">
              <i class="bi bi-star-fill" aria-hidden="true"></i>
              Default
            </span>
          </div>

          <div class="saved-coords">Lat {{ loc.lat }} / Lon {{ loc.lon }}</div>

          <div class="saved-actions">
            <button type="button" class="btn-accent btn-sm" (click)="open(loc.name, loc.lat, loc.lon)">
              <i class="bi bi-eye" aria-hidden="true"></i>
              Open
            </button>
            <button type="button" class="btn-outline-accent btn-sm" (click)="setDefault(loc.name)">
              <i class="bi bi-star" aria-hidden="true"></i>
              Default
            </button>
            <button type="button" class="btn-sm btn-danger-outline" (click)="remove(loc.name)">
              <i class="bi bi-trash" aria-hidden="true"></i>
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!locations.saved().length">
        <i class="bi bi-bookmark" aria-hidden="true"></i>
        <div class="empty-title">No saved locations yet</div>
        <p class="empty-hint">Save your favorite places to jump back to their weather in a tap.</p>
        <a class="btn-accent btn-sm" routerLink="/search">
          <i class="bi bi-search" aria-hidden="true"></i>
          Find a location
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .saved-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .saved-tile {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.25rem;
        height: 100%;
      }

      .saved-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .saved-name {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text);
      }

      .saved-default {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--accent);
        white-space: nowrap;
      }

      .saved-coords {
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      .saved-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-top: auto;
        padding-top: 0.85rem;
      }

      .saved-actions .btn-sm {
        padding: 0.45rem 1rem;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }

      .btn-danger-outline {
        background: transparent;
        color: var(--danger);
        border: 1px solid var(--danger);
        font-weight: 600;
        border-radius: var(--radius-pill);
        transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
        cursor: pointer;
      }

      .btn-danger-outline:hover {
        background: var(--danger);
        color: var(--danger-contrast);
        transform: translateY(-2px);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        margin-top: 1.5rem;
        padding: 2.75rem 1.5rem;
        text-align: center;
      }

      .empty-state > i {
        font-size: 2.5rem;
        color: var(--accent);
      }

      .empty-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text);
      }

      .empty-hint {
        max-width: 26rem;
        margin: 0;
        color: var(--text-muted);
      }

      .empty-state .btn-sm {
        margin-top: 0.5rem;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        text-decoration: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedComponent {
  readonly locations = inject(LocationService);
  private readonly state = inject(WeatherStateService);

  open(name: string, lat?: number, lon?: number) {
    const target = lat != null && lon != null ? `${lat},${lon}` : name;
    this.locations.addRecent(name);
    this.locations.recordAction('view', name);
    this.state.setLocation(target);
  }

  setDefault(name: string) {
    this.locations.setDefault(name);
  }

  remove(name: string) {
    this.locations.removeLocation(name);
  }

  trackByName = (_: number, loc: any) => loc?.name;
}
