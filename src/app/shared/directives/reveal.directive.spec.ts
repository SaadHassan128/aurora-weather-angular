import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: `<div appReveal [appReveal]="2" data-testid="el">hi</div>`,
})
class HostComponent {}

describe('RevealDirective', () => {
  it('adds the reveal class on init', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;
    expect(el.classList.contains('reveal')).toBe(true);
  });

  it('applies a staggered transition-delay from the index input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;
    // index 2 -> (2 % 3) * 90 = 180ms
    expect(el.style.transitionDelay).toBe('180ms');
  });
});
