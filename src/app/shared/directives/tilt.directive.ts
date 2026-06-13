import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly max = 6; // degrees

  ngOnInit(): void {
    this.el.nativeElement.classList.add('tilt');
  }

  private get enabled(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    return !reduce && !coarse;
  }

  @HostListener('pointermove', ['$event'])
  onMove(e: PointerEvent): void {
    if (!this.enabled) return;
    const node = this.el.nativeElement;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    node.style.setProperty('--rx', `${px * this.max}deg`);
    node.style.setProperty('--ry', `${-py * this.max}deg`);
  }

  @HostListener('pointerleave')
  onLeave(): void {
    const node = this.el.nativeElement;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  }
}
