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

  it('reveals immediately when IntersectionObserver is unavailable (fallback)', () => {
    // jsdom has no IntersectionObserver, so the directive takes the fallback path
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;
    expect(el.classList.contains('reveal-visible')).toBe(true);
  });

  it('uses IntersectionObserver when available: reveals on intersect and unobserves', () => {
    const observed: Element[] = [];
    const unobserved: Element[] = [];
    let capturedCb: IntersectionObserverCallback | null = null;

    class FakeIO {
      constructor(cb: IntersectionObserverCallback) { capturedCb = cb; }
      observe = (el: Element) => { observed.push(el); };
      unobserve = (el: Element) => { unobserved.push(el); };
      disconnect = () => {};
    }
    const original = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    try {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[data-testid="el"]') as HTMLElement;

      // observer path: not visible yet, element is being observed
      expect(el.classList.contains('reveal-visible')).toBe(false);
      expect(observed).toContain(el);
      expect(capturedCb).not.toBeNull();

      // fire an intersecting entry
      capturedCb!([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

      expect(el.classList.contains('reveal-visible')).toBe(true);
      expect(unobserved).toContain(el);
    } finally {
      (globalThis as any).IntersectionObserver = original;
    }
  });
});
