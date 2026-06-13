import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TiltDirective } from './tilt.directive';

@Component({
  standalone: true,
  imports: [TiltDirective],
  template: `<div appTilt data-testid="el">hi</div>`,
})
class HostComponent {}

describe('TiltDirective', () => {
  it('adds the tilt class on init', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;
    expect(el.classList.contains('tilt')).toBe(true);
  });

  it('resets --rx/--ry to 0deg on pointer leave', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;
    el.dispatchEvent(new Event('pointerleave'));
    expect(el.style.getPropertyValue('--rx')).toBe('0deg');
    expect(el.style.getPropertyValue('--ry')).toBe('0deg');
  });
});
