import { TestBed } from '@angular/core/testing';
import { MoodService, type Mood } from './mood.service';

describe('MoodService', () => {
  let service: MoodService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoodService);
    document.documentElement.removeAttribute('data-mood');
  });

  it('maps clear daytime conditions to "clear"', () => {
    expect(service.moodFor('Sunny', true)).toBe<Mood>('clear');
    expect(service.moodFor('Clear', true)).toBe<Mood>('clear');
  });

  it('maps rain/storm conditions to "rain"', () => {
    expect(service.moodFor('Light rain', true)).toBe<Mood>('rain');
    expect(service.moodFor('Thunderstorm', true)).toBe<Mood>('rain');
    expect(service.moodFor('Drizzle', true)).toBe<Mood>('rain');
  });

  it('maps snow/fog/mist and unknowns to "clouds"', () => {
    expect(service.moodFor('Snow', true)).toBe<Mood>('clouds');
    expect(service.moodFor('Fog', true)).toBe<Mood>('clouds');
    expect(service.moodFor('Partly cloudy', true)).toBe<Mood>('clouds');
    expect(service.moodFor('', true)).toBe<Mood>('clouds');
  });

  it('always returns "night" when isDay is false, regardless of condition', () => {
    expect(service.moodFor('Sunny', false)).toBe<Mood>('night');
    expect(service.moodFor('Rain', false)).toBe<Mood>('night');
  });

  it('apply() sets the data-mood attribute on <html>', () => {
    service.apply('Sunny', true);
    expect(document.documentElement.getAttribute('data-mood')).toBe('clear');
  });
});
