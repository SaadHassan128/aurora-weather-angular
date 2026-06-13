import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Optional index for staggered cascade: delay = (index % 3) * 90ms */
  @Input('appReveal') index: number | '' = '';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    node.classList.add('reveal');
    const i = typeof this.index === 'number' ? this.index : 0;
    node.style.transitionDelay = `${(i % 3) * 90}ms`;

    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      node.classList.add('reveal-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('reveal-visible');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
