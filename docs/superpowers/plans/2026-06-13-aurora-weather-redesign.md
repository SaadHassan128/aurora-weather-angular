# Aurora Weather "Beyond" Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Aurora Weather Angular SPA to the "Beyond" standard from `Skills/PORTFOLIO-DESIGN-BRIEF.md` — a calm, premium look with an adaptive 4-mood palette, Sora + Inter typography, a bento layout, grouped navigation, and subtle CSS-3D motion — across the global system and all 10 screens.

**Architecture:** A global design-token layer (`styles.scss`) drives everything; neutral navy surfaces stay fixed while a `data-mood` attribute on `<html>` swaps the accent + background glow. Two tiny Angular directives (`appReveal`, `appTilt`) provide motion. A small `MoodService` derives the mood from existing weather data via an effect — the only behavioral addition. All other changes are markup/styling plus UX-state fixes (loading/empty/error/a11y). Data, services, API, and routing are untouched.

**Tech Stack:** Angular 21 (standalone components, signals, OnPush), SCSS, Bootstrap 5 (layout/utility base, visually overridden by tokens), Chart.js/ng2-charts, Leaflet. Tests: Vitest via `@angular/build:unit-test` + Angular TestBed (jsdom).

**Reference spec:** `docs/superpowers/specs/2026-06-13-aurora-weather-redesign-design.md`

---

## Conventions for this plan

- **All commands run from `weather-app/`** unless stated otherwise. The repo root is one level up (`Front-end Weather project/`); git commands run from the root.
- **Build verify:** `npm run build` — Expected: `Application bundle generation complete.` with no errors.
- **Unit tests:** `npm test -- --watch=false` — Expected: all specs pass (Vitest single-run mode).
- **Browser verify:** `npm start`, open `http://localhost:4200`, screenshot the relevant route at 360 / 768 / 1024 / 1440 px. (Port 4200 must be free — kill any stale `node` process holding it first.)
- **TDD note:** Logic units (MoodService, directives) get real failing-test-first specs. Pure visual/CSS changes are verified by **build pass + browser screenshot** (they cannot be meaningfully unit-tested); each such task says so explicitly.
- **Commit style:** conventional commits; end the body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Created:**
- `weather-app/src/app/core/services/mood.service.ts` — maps weather → mood, sets `data-mood` on `<html>`.
- `weather-app/src/app/core/services/mood.service.spec.ts` — unit tests.
- `weather-app/src/app/shared/directives/reveal.directive.ts` — `appReveal` scroll-reveal.
- `weather-app/src/app/shared/directives/reveal.directive.spec.ts` — unit tests.
- `weather-app/src/app/shared/directives/tilt.directive.ts` — `appTilt` hover tilt.
- `weather-app/src/app/shared/directives/tilt.directive.spec.ts` — unit tests.

**Modified (major):**
- `weather-app/src/styles.scss` — token system (the heart of the redesign).
- `weather-app/src/index.html` — Google Fonts preconnect; inline theme+mood bootstrap script.
- `weather-app/src/app/app.scss` + `app.html` + `app.ts` — shell background, mood wiring.
- `weather-app/src/app/shared/layout/header.component.ts` — grouped nav.
- Each of the 10 feature components under `weather-app/src/app/features/*`.

**Untouched:** all services except adding MoodService; `app.routes.ts`; all models; API/data logic.

---

## Phase 0 — Baseline & safety

### Task 0: Commit the current app as a baseline

**Files:** none changed — captures existing `weather-app/` source under version control so redesign diffs are reviewable.

- [ ] **Step 1: Confirm node_modules is ignored**

Run (from repo root): `git check-ignore weather-app/node_modules`
Expected: prints `weather-app/node_modules` (it is ignored).

- [ ] **Step 2: Stage the app source and config**

Run (from repo root):
```bash
git add weather-app/ .claude/ 2>/dev/null
git status -s | grep -c "^A" 
```
Expected: a non-zero count of added files (source files staged, `node_modules` excluded).

- [ ] **Step 3: Commit the baseline**

Run (from repo root):
```bash
git commit -m "chore: baseline existing Aurora Weather app before redesign

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify the build still works pre-redesign**

Run (from `weather-app/`): `npm run build`
Expected: `Application bundle generation complete.` — this is the known-good baseline.

- [ ] **Step 5: Verify tests pass pre-redesign**

Run (from `weather-app/`): `npm test -- --watch=false`
Expected: existing App specs pass.

---

## Phase 1 — Design system foundation (spec §2)

### Task 1: Replace global tokens in `styles.scss`

**Files:**
- Modify: `weather-app/src/styles.scss` (replace `:root` / `.theme-light` token blocks and helper classes; keep the Bootstrap/Leaflet `@use`/`@import` lines and the `.visually-hidden-focusable` block).

**Type of task:** Visual/CSS — verified by build + browser, not unit tests.

- [ ] **Step 1: Replace the top of `styles.scss` (imports stay) with the new token system**

Keep lines 1-3 (`@use 'bootstrap/scss/bootstrap';`, the bootstrap-icons import, the leaflet import). Replace the `:root { … }` and `.theme-light { … }` blocks (current lines 5-35) with:

```scss
/* ===== Neutral surfaces (never change with weather) ===== */
:root,
[data-theme='dark'] {
  --bg: #0a1428;
  --bg-grad: linear-gradient(165deg, #0f1f3d 0%, #0a1428 60%, #0b1020 100%);
  --surface: #16233f;
  --surface-2: #1b2c4d;
  --border: #243450;
  --text: #e8eef6;
  --text-muted: #9fb3c8;
  --danger: #ff5d6c;
  --danger-contrast: #ffffff;
  --success: #34d399;
  --warning: #fbbf24;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

[data-theme='light'] {
  --bg: #f4f7fb;
  --bg-grad: linear-gradient(165deg, #f8fafc 0%, #eef2f7 100%);
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  --border: #d8e0ea;
  --text: #0f172a;
  --text-muted: #475569;
  --danger: #dc2626;
  --danger-contrast: #ffffff;
  --success: #059669;
  --warning: #d97706;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
}

/* ===== Adaptive accent + glow (swapped by data-mood on <html>) ===== */
:root,
[data-mood='clouds'] {
  --accent: #38bdf8;
  --accent-hover: #5fcbfa;
  --accent-contrast: #0b1020;
  --bg-glow: radial-gradient(circle at 80% 14%, rgba(56, 189, 248, 0.14) 0%, transparent 44%);
}
[data-mood='clear'] {
  --accent: #ffb45a;
  --accent-hover: #ffc879;
  --accent-contrast: #1a1024;
  --bg-glow: radial-gradient(circle at 80% 14%, rgba(255, 180, 90, 0.16) 0%, transparent 46%);
}
[data-mood='rain'] {
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --accent-contrast: #0b1020;
  --bg-glow: radial-gradient(circle at 80% 14%, rgba(59, 130, 246, 0.16) 0%, transparent 46%);
}
[data-mood='night'] {
  --accent: #a78bfa;
  --accent-hover: #c4b5fd;
  --accent-contrast: #16102a;
  --bg-glow: radial-gradient(circle at 80% 14%, rgba(167, 139, 250, 0.16) 0%, transparent 46%);
}

:root {
  --font-heading: 'Sora', 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --radius: 12px;
  --radius-pill: 999px;
  --maxw: 1200px;
  --accent-soft: color-mix(in srgb, var(--accent) 14%, transparent);
  /* accent transition for the mood shift */
  --mood-ease: color 0.6s ease, background 0.6s ease, border-color 0.6s ease;
}
```

- [ ] **Step 2: Update `body`, headings, links, and helper classes (rest of file)**

Replace the existing `body` rules, the `body:not(.theme-light)` / `body.theme-light` background rules, the `a`/headings rules, `.glass-card`, `.section-title`, `.text-label`, `.navbar .nav-link`, and the `.weather-bg-*` blocks with the token-based versions below. Keep `.visually-hidden-focusable`, `.fade-in`/`@keyframes fadeIn`, `.skeleton`/`@keyframes shimmer`, `.pill`:

```scss
* { box-sizing: border-box; }

body {
  margin: 0;
  color: var(--text);
  font-family: var(--font-body);
  min-height: 100vh;
  background: var(--bg-glow), var(--bg-grad);
  background-attachment: fixed;
  transition: var(--mood-ease);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--text);
  letter-spacing: -0.01em;
}

a { color: var(--accent); text-decoration: none; transition: color 0.2s ease; }
a:hover { color: var(--accent-hover); }

.card,
.glass-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.card:hover,
.glass-card:hover { transform: translateY(-2px); border-color: var(--accent); }

.section-title {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-family: var(--font-heading);
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text);
}
.section-title i { color: var(--accent); }

.text-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.btn-accent {
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  padding: 11px 28px;
  font-weight: 700;
  border-radius: var(--radius-pill);
  transition: transform 0.25s, background 0.25s, box-shadow 0.25s;
}
.btn-accent:hover {
  transform: translateY(-2px);
  background: var(--accent-hover);
  color: var(--accent-contrast);
}
.btn-outline-accent {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  padding: 10px 26px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  transition: all 0.25s;
}
.btn-outline-accent:hover { background: var(--accent); color: var(--accent-contrast); transform: translateY(-2px); }

.pill {
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--text);
}

.text-muted { color: var(--text-muted) !important; }
::placeholder { color: var(--text-muted); opacity: 0.9; }
::selection { background: var(--accent-soft); color: var(--text); }

/* Custom scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
```

- [ ] **Step 3: Add the reveal / tilt / reduced-motion CSS at the end of `styles.scss`**

```scss
/* ===== Scroll reveal ===== */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}
.reveal-visible { opacity: 1; transform: none; }

.reveal-3d {
  opacity: 0;
  transform: perspective(1000px) rotateX(-16deg) rotateY(6deg) translateY(60px) translateZ(-120px);
  transition: opacity 0.7s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: opacity, transform;
}
.reveal-3d.reveal-visible {
  transform: perspective(1000px) rotateX(0) rotateY(0) translateY(0) translateZ(0);
}
@media (max-width: 768px) {
  .reveal-3d { transform: perspective(1000px) rotateX(-8deg) translateY(40px) translateZ(-40px); }
}

/* ===== Tilt (driven by appTilt setting --rx/--ry) ===== */
.tilt {
  transform: perspective(800px) rotateX(var(--ry, 0deg)) rotateY(var(--rx, 0deg));
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
}

/* ===== NON-NEGOTIABLE reduced-motion guard ===== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  .reveal, .reveal-3d { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: `Application bundle generation complete.` with no SCSS errors.

- [ ] **Step 5: Browser verify**

Run: `npm start`; open `http://localhost:4200`; confirm the app renders on calm navy (no neon), cards are bordered surfaces, no console errors. Screenshot the dashboard.

- [ ] **Step 6: Commit**

```bash
git add weather-app/src/styles.scss
git commit -m "feat(styles): replace neon tokens with calm adaptive design system

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 2: Fonts + theme/mood bootstrap in `index.html`

**Files:**
- Modify: `weather-app/src/index.html` (add `<link>` preconnect + Google Fonts; add inline bootstrap script; the body keeps `theme-light` class support removed in favor of `data-theme`).

**Type of task:** Visual + tiny inline script — verified by build + browser (no-flash check).

- [ ] **Step 1: Add font preconnect + stylesheet in `<head>`** (after the `<meta name="viewport">` line)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: Add the inline theme+mood bootstrap script** as the **first** element inside `<head>` after `<meta charset>` (runs before paint, no flash)

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('aurora-theme');
      if (!t) {
        t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.setAttribute('data-mood', 'clouds');
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-mood', 'clouds');
    }
  })();
</script>
```

- [ ] **Step 3: Build verify**

Run: `npm run build`
Expected: build completes; fonts referenced in output.

- [ ] **Step 4: Browser verify (no flash)**

Run: `npm start`; hard-refresh `http://localhost:4200`; confirm Sora headings + Inter body render, and there is **no white/neon flash** before the navy theme applies. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/index.html
git commit -m "feat(index): load Sora+Inter and bootstrap theme/mood before paint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 2 — Motion directives (spec §3)

### Task 3: `appReveal` directive (TDD)

**Files:**
- Create: `weather-app/src/app/shared/directives/reveal.directive.ts`
- Test: `weather-app/src/app/shared/directives/reveal.directive.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --filter reveal.directive`
Expected: FAIL — cannot find `./reveal.directive`.

- [ ] **Step 3: Write minimal implementation**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --watch=false --filter reveal.directive`
Expected: PASS (both specs). Note: jsdom lacks `IntersectionObserver`, so the directive takes the fallback path and still adds `reveal` + sets the delay — exactly what the tests assert.

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/shared/directives/reveal.directive.ts weather-app/src/app/shared/directives/reveal.directive.spec.ts
git commit -m "feat(motion): add appReveal scroll-reveal directive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 4: `appTilt` directive (TDD)

**Files:**
- Create: `weather-app/src/app/shared/directives/tilt.directive.ts`
- Test: `weather-app/src/app/shared/directives/tilt.directive.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --filter tilt.directive`
Expected: FAIL — cannot find `./tilt.directive`.

- [ ] **Step 3: Write minimal implementation**

```typescript
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
    // honour reduced-motion and skip on coarse (touch) pointers
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --watch=false --filter tilt.directive`
Expected: PASS (both specs).

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/shared/directives/tilt.directive.ts weather-app/src/app/shared/directives/tilt.directive.spec.ts
git commit -m "feat(motion): add appTilt hover-tilt directive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 3 — Adaptive mood wiring (spec §5)

### Task 5: `MoodService` (TDD)

**Files:**
- Create: `weather-app/src/app/core/services/mood.service.ts`
- Test: `weather-app/src/app/core/services/mood.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --filter mood.service`
Expected: FAIL — cannot find `./mood.service`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Mood = 'clear' | 'clouds' | 'rain' | 'night';

@Injectable({ providedIn: 'root' })
export class MoodService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Pure mapping: condition text + day flag -> mood. */
  moodFor(condition: string | undefined | null, isDay: boolean): Mood {
    if (!isDay) return 'night';
    const c = (condition ?? '').toLowerCase();
    if (/(rain|drizzle|thunder|storm|shower)/.test(c)) return 'rain';
    if (/(sun|clear)/.test(c)) return 'clear';
    // snow, fog, mist, cloud, unknown -> clouds
    return 'clouds';
  }

  /** Side-effecting: set data-mood on <html> (browser only). */
  apply(condition: string | undefined | null, isDay: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-mood', this.moodFor(condition, isDay));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --watch=false --filter mood.service`
Expected: PASS (all 5 specs).

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/core/services/mood.service.ts weather-app/src/app/core/services/mood.service.spec.ts
git commit -m "feat(mood): add MoodService mapping weather to adaptive accent

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 6: Wire MoodService into the app via an effect

**Files:**
- Modify: `weather-app/src/app/app.ts` (inject MoodService; add an `effect` that calls `apply()` when `currentWeather()` changes).

**Note:** Confirm the `CurrentWeather` model exposes `condition.text` and `isDay` (it does — see `weather-api.service.ts` `mapCurrentFromStormglass`). The effect reads the existing `WeatherStateService.currentWeather()` signal.

- [ ] **Step 1: Add an effect in `app.ts`**

Modify `app.ts` to inject MoodService and register an effect in the constructor field initializer area. Replace the class body imports/fields as follows (keep existing PreferencesService/WeatherStateService injects):

```typescript
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: build completes (effect compiles, no DI errors).

- [ ] **Step 3: Test verify**

Run: `npm test -- --watch=false`
Expected: existing App spec still passes (App still creates; effect is inert without weather data in the test).

- [ ] **Step 4: Browser verify (mood shift)**

Run: `npm start`; open `http://localhost:4200`; in DevTools confirm `<html data-mood="…">` updates after weather loads (the mock fallback returns "Partly Cloudy" → `clouds`; accent stays sky-blue). Manually set `document.documentElement.setAttribute('data-mood','clear')` in console and confirm the accent + glow shift to amber smoothly. Screenshot both.

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/app.ts
git commit -m "feat(mood): drive data-mood from current weather via effect

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 4 — App shell & navigation (spec §4)

### Task 7: Shell background + theme attribute migration

**Files:**
- Modify: `weather-app/src/app/app.scss` (background now comes from `body`; keep `main` min-height; remove the duplicated radial gradient).
- Modify: `weather-app/src/app/shared/layout/header.component.ts` `toggleTheme()` and `PreferencesService` usage so theme is written as `data-theme` on `<html>` + persisted to `localStorage('aurora-theme')` instead of toggling a `theme-light` body class.

**Type of task:** Visual + small logic — build + browser verify; theme persistence checked manually.

- [ ] **Step 1: Simplify `app.scss`** (background moved to body in Task 1)

Replace the entire file with:

```scss
.app-shell {
  min-height: 100vh;
}

main {
  min-height: calc(100vh - 72px);
}
```

- [ ] **Step 2: Update `toggleTheme()` in `header.component.ts`** to set `data-theme` + persist, and read initial theme from the attribute

Replace the existing `theme` field + `toggleTheme()` method:

```typescript
theme: 'dark' | 'light' =
  (typeof document !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') as 'dark' | 'light')) ||
  'dark';

toggleTheme() {
  this.theme = this.theme === 'dark' ? 'light' : 'dark';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', this.theme);
    try { localStorage.setItem('aurora-theme', this.theme); } catch {}
  }
  this.preferences.update({ theme: this.theme });
}
```

- [ ] **Step 3: Build verify**

Run: `npm run build`
Expected: build completes.

- [ ] **Step 4: Browser verify (theme toggle + persistence)**

Run: `npm start`; toggle theme; confirm `<html data-theme>` flips, surfaces/text switch correctly, and the choice **persists across reload**. Screenshot dark + light.

- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/app.scss weather-app/src/app/shared/layout/header.component.ts
git commit -m "feat(shell): move background to body and migrate theme to data-theme

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 8: Grouped navigation header

**Files:**
- Modify: `weather-app/src/app/shared/layout/header.component.ts` (template + styles): brand, primary links (Dashboard/Current/Forecast/Maps), a "More ▾" dropdown (Search/Saved/Alerts/History), right cluster (quick-search kept, theme, refresh, settings/about icons); mobile drawer with scroll-lock; scroll-shrink; `aria-current`.

**Type of task:** Visual + interaction — build + browser verify across breakpoints; a11y checked manually.

- [ ] **Step 1: Replace the `<nav>` template** with the grouped structure (keep the existing `searchControl`, `suggestions`, `selectSuggestion`, `refresh`, `menuOpen`, `toggleMenu` members)

```html
<nav class="aurora-nav" [class.shrink]="scrolled()" aria-label="Primary">
  <div class="nav-inner">
    <a class="brand" routerLink="/dashboard" aria-label="Aurora Weather Home">
      <i class="bi bi-cloud-sun-fill"></i> <span>Aurora</span>
    </a>

    <button
      class="nav-toggle"
      type="button"
      [attr.aria-expanded]="menuOpen()"
      aria-controls="navMenu"
      aria-label="Toggle navigation"
      (click)="toggleMenu()"
    >
      <i class="bi" [ngClass]="menuOpen() ? 'bi-x-lg' : 'bi-list'"></i>
    </button>

    <div class="nav-links" id="navMenu" [class.open]="menuOpen()">
      <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Dashboard</a>
      <a routerLink="/current" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Current</a>
      <a routerLink="/forecast" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Forecast</a>
      <a routerLink="/maps" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Maps</a>

      <div class="more" [class.open]="moreOpen()">
        <button type="button" class="more-btn" [attr.aria-expanded]="moreOpen()" (click)="toggleMore()">
          More <i class="bi bi-chevron-down"></i>
        </button>
        <div class="more-menu" role="menu">
          <a routerLink="/search" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Search</a>
          <a routerLink="/saved" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Saved</a>
          <a routerLink="/alerts" routerLinkActive="active" (click)="closeMenu()" role="menuitem">Alerts</a>
          <a routerLink="/history" routerLinkActive="active" (click)="closeMenu()" role="menuitem">History</a>
        </div>
      </div>

      <div class="nav-right">
        <div class="quick-search">
          <input
            [formControl]="searchControl"
            type="search"
            class="qs-input"
            placeholder="Search city…"
            aria-label="Quick search city"
          />
          <div class="qs-results" *ngIf="suggestions.length && searchControl.value">
            <button type="button" *ngFor="let s of suggestions" (click)="selectSuggestion(s)">
              {{ s.name }} <small>{{ s.country }}</small>
            </button>
          </div>
        </div>
        <button class="icon-btn" (click)="toggleTheme()" aria-label="Toggle theme">
          <i class="bi" [ngClass]="theme === 'dark' ? 'bi-moon-stars' : 'bi-sun'"></i>
        </button>
        <button class="icon-btn" (click)="refresh()" aria-label="Refresh data"><i class="bi bi-arrow-clockwise"></i></button>
        <a class="icon-btn" routerLink="/settings" routerLinkActive="active" (click)="closeMenu()" aria-label="Settings"><i class="bi bi-gear"></i></a>
        <a class="icon-btn" routerLink="/about" routerLinkActive="active" (click)="closeMenu()" aria-label="About"><i class="bi bi-info-circle"></i></a>
      </div>
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Replace the component `styles` array** with token-based nav styles

```scss
.aurora-nav {
  position: sticky; top: 0; z-index: 100;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition: padding 0.25s ease;
}
.nav-inner { max-width: var(--maxw); margin: 0 auto; display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.25rem; }
.aurora-nav.shrink .nav-inner { padding: 0.5rem 1.25rem; }
.brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
.brand i { color: var(--accent); }
.nav-toggle { display: none; background: none; border: none; color: var(--text); font-size: 1.4rem; min-width: 44px; min-height: 44px; }
.nav-links { display: flex; align-items: center; gap: 0.25rem; flex: 1; }
.nav-links > a { color: var(--text-muted); padding: 0.5rem 0.85rem; border-radius: var(--radius-pill); font-weight: 500; transition: color 0.2s, background 0.2s; }
.nav-links > a:hover { color: var(--text); }
.nav-links > a.active { color: var(--accent-contrast); background: var(--accent); }
.more { position: relative; }
.more-btn { background: none; border: none; color: var(--text-muted); font-weight: 500; padding: 0.5rem 0.85rem; cursor: pointer; }
.more-menu { display: none; position: absolute; top: 100%; left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 0.4rem; min-width: 160px; flex-direction: column; }
.more.open .more-menu { display: flex; }
.more-menu a { color: var(--text-muted); padding: 0.5rem 0.75rem; border-radius: 8px; }
.more-menu a:hover, .more-menu a.active { color: var(--text); background: var(--surface-2); }
.nav-right { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
.quick-search { position: relative; }
.qs-input { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius-pill); padding: 0.4rem 0.9rem; font-size: 0.85rem; min-width: 180px; }
.qs-results { position: absolute; top: 110%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); max-height: 280px; overflow-y: auto; z-index: 10; }
.qs-results button { display: block; width: 100%; text-align: left; background: none; border: none; color: var(--text); padding: 0.5rem 0.75rem; }
.qs-results button:hover { background: var(--surface-2); }
.qs-results small { color: var(--text-muted); }
.icon-btn { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); width: 40px; height: 40px; min-width: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.icon-btn:hover, .icon-btn.active { color: var(--accent); border-color: var(--accent); }

@media (max-width: 991px) {
  .nav-toggle { display: inline-flex; margin-left: auto; }
  .nav-links { position: fixed; inset: 64px 0 0 auto; width: min(82vw, 320px); flex-direction: column; align-items: stretch; background: var(--surface); border-left: 1px solid var(--border); padding: 1rem; gap: 0.25rem; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); overflow-y: auto; }
  .nav-links.open { transform: translateX(0); }
  .more-menu { position: static; display: flex; box-shadow: none; border: none; padding-left: 0.5rem; }
  .nav-right { margin-left: 0; flex-wrap: wrap; }
  .qs-input { min-width: 0; width: 100%; }
}
```

- [ ] **Step 3: Add `scrolled`, `moreOpen`, `closeMenu`, `toggleMore` members + scroll listener + body scroll-lock**

Add to the class (keep existing members):

```typescript
readonly scrolled = signal(false);
readonly moreOpen = signal(false);

@HostListener('window:scroll')
onScroll() {
  if (typeof window !== 'undefined') this.scrolled.set(window.scrollY > 40);
}

@HostListener('document:keydown.escape')
onEsc() { this.closeMenu(); this.moreOpen.set(false); }

toggleMore() { this.moreOpen.update((v) => !v); }

closeMenu() {
  this.menuOpen.set(false);
  this.moreOpen.set(false);
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}
```

And update the existing `toggleMenu()` to lock body scroll:

```typescript
toggleMenu() {
  this.menuOpen.update((v) => !v);
  if (typeof document !== 'undefined') {
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
  }
}
```

Add the needed imports to the existing `@angular/core` import line: `HostListener`. (`signal` is already imported.)

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build completes.

- [ ] **Step 5: Browser verify across breakpoints**

Run: `npm start`. At **1440/1024**: primary links + More dropdown + right cluster visible; active pill on current route; nav shrinks after scrolling. At **768/360**: hamburger opens the drawer, body scroll locks, Esc/tap-outside/link-tap closes it, touch targets ≥44px, no horizontal scroll. Screenshot each breakpoint.

- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/shared/layout/header.component.ts
git commit -m "feat(nav): grouped top nav with More menu, mobile drawer, scroll-shrink

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 5 — Per-screen redesign (spec §5)

> Each screen task follows the same shape: apply tokens/`.card`, lay out as a bento grid, add `appReveal` (stagger via index) and `appTilt` on feature cards, restyle charts/maps to the accent, and add real loading/empty/error states. These are visual + UX-state changes verified by **build + browser screenshots at 360/768/1024/1440** plus `npm test -- --watch=false` staying green. Highest-impact first.

### Task 9: Dashboard

**Files:** Modify `weather-app/src/app/features/dashboard/dashboard.component.ts` (template, styles, imports — add `RevealDirective`, `TiltDirective`; restyle chart colors to CSS-var-derived values).

- [ ] **Step 1:** Import `RevealDirective` and `TiltDirective`; add them to the component `imports` array.
- [ ] **Step 2:** Wrap the existing top cards in a bento grid (`current-hero` + `hourly-chart` first row; `forecast` / `alerts` / `saved+history` below), replacing Bootstrap `row g-3` columns with a CSS grid in the component styles. Apply `class="card"`, add `appReveal [appReveal]="i"` to each card (i = 0,1,2…) and `appTilt` to the hero card.
- [ ] **Step 3:** Replace the hard-coded Chart.js colors (`#00d9ff`, `#ff006e`, `#76ff00`, etc. in `chartOptions` and `seriesChartData`) with values read once from CSS vars:

```typescript
private accent(): string {
  if (typeof getComputedStyle === 'undefined') return '#38bdf8';
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#38bdf8';
}
```
Use `this.accent()` for `borderColor`/`pointBackgroundColor`; use `rgba` derived from text-muted for grid lines; set tick colors to `--text-muted`.

- [ ] **Step 4: Build verify** — `npm run build` → completes.
- [ ] **Step 5: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 6: Browser verify** — dashboard renders as a bento grid; cards reveal/cascade on load; hero tilts on hover; chart uses the accent; switch `data-mood` in console → chart + accents follow. Screenshot 360/768/1024/1440.
- [ ] **Step 7: Commit**

```bash
git add weather-app/src/app/features/dashboard/dashboard.component.ts
git commit -m "feat(dashboard): bento layout, reveal/tilt motion, accent-driven chart

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 10: Current

**Files:** Modify `weather-app/src/app/features/current/current.component.ts`.

- [ ] **Step 1:** Import `RevealDirective`/`TiltDirective`; add to `imports`.
- [ ] **Step 2:** Lay out as a hero temp + metric-tile bento (feels-like, wind, humidity, UV, pressure, visibility, cloud) using `.card` tiles in a CSS grid; `appReveal` staggered; `appTilt` on the hero.
- [ ] **Step 3:** Add real **loading** (skeleton tiles using the existing `.skeleton` class), **empty** ("Search for a location to see current conditions"), and **error** states — driven by the existing `weather.isLoading()` / `weather.error()` / `currentWeather()` signals (no service changes).
- [ ] **Step 4: Build verify** — `npm run build` → completes.
- [ ] **Step 5: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 6: Browser verify** — hero + metric bento; skeletons while loading; empty/error states reachable (e.g. set an invalid location). Screenshot 360/768/1024/1440.
- [ ] **Step 7: Commit**

```bash
git add weather-app/src/app/features/current/current.component.ts
git commit -m "feat(current): hero + metric bento with loading/empty/error states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 11: Forecast

**Files:** Modify `weather-app/src/app/features/forecast/forecast.component.ts`.

- [ ] **Step 1:** Import directives; add to `imports`.
- [ ] **Step 2:** Day cards (`.card`, `appReveal` stagger) + an hourly strip; restyle any Chart.js instance to the accent via the `accent()` helper pattern from Task 9 Step 3.
- [ ] **Step 3:** Add loading skeletons + empty state ("No forecast available").
- [ ] **Step 4: Build verify** — `npm run build` → completes.
- [ ] **Step 5: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 6: Browser verify** — day cards + hourly strip; reveal motion; accent chart. Screenshot 360/768/1024/1440.
- [ ] **Step 7: Commit**

```bash
git add weather-app/src/app/features/forecast/forecast.component.ts
git commit -m "feat(forecast): card layout, reveal motion, accent chart, empty state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 12: Maps

**Files:** Modify `weather-app/src/app/features/maps/maps.component.ts`.

- [ ] **Step 1:** Wrap the Leaflet container in a `.card` with a section title; ensure the map fills a fixed-aspect framed area.
- [ ] **Step 2:** Restyle Leaflet controls/attribution for the dark theme via component styles (`:host ::ng-deep .leaflet-control { … }`, accent zoom buttons, surface attribution). Keep all map logic/markers unchanged.
- [ ] **Step 3:** Add a loading state while tiles/data load and an empty state if no location is selected.
- [ ] **Step 4: Build verify** — `npm run build` → completes.
- [ ] **Step 5: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 6: Browser verify** — map sits in a framed card; controls match the theme; no layout overflow. Screenshot 360/768/1024/1440.
- [ ] **Step 7: Commit**

```bash
git add weather-app/src/app/features/maps/maps.component.ts
git commit -m "feat(maps): framed card, dark-theme Leaflet controls, loading/empty states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 13: Search

**Files:** Modify `weather-app/src/app/features/search/search.component.ts`.

- [ ] **Step 1:** Prominent search field (token-styled) centered above results; result cards (`.card`, `appReveal` stagger) each with an "Add to saved" cue/button using the existing add logic.
- [ ] **Step 2:** Add **empty** ("Search any city to get started"), **no-results** ("No matches for '…'"), and **loading** states from existing signals.
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — typing shows result cards; empty + no-results states reachable. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/search/search.component.ts
git commit -m "feat(search): prominent field, result cards, empty/no-results states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 14: Saved

**Files:** Modify `weather-app/src/app/features/saved/saved.component.ts`.

- [ ] **Step 1:** Saved-location cards (`.card`, hover-lift, `appReveal` stagger) with open + remove actions (existing logic); bento grid layout.
- [ ] **Step 2:** Empty state ("No saved locations yet — add some from Search").
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — saved cards grid + empty state. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/saved/saved.component.ts
git commit -m "feat(saved): location cards grid with empty state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 15: Alerts

**Files:** Modify `weather-app/src/app/features/alerts/alerts.component.ts`.

- [ ] **Step 1:** Alert cards using **semantic** `--danger`/`--warning` (not neon), severity-coded; `appReveal` stagger.
- [ ] **Step 2:** Empty state ("No active weather alerts").
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — alert cards with semantic colors + empty state. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/alerts/alerts.component.ts
git commit -m "feat(alerts): semantic severity cards with empty state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 16: History

**Files:** Modify `weather-app/src/app/features/history/history.component.ts`.

- [ ] **Step 1:** Date picker (token-styled) + a bento of historical stat cards / chart; restyle chart to accent via the `accent()` helper.
- [ ] **Step 2:** Loading skeletons + empty state ("Pick a date to see historical weather").
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — date picker + stats bento + accent chart; empty/loading reachable. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/history/history.component.ts
git commit -m "feat(history): date picker, stats bento, accent chart, empty/loading states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 17: Settings

**Files:** Modify `weather-app/src/app/features/settings/settings.component.ts`.

- [ ] **Step 1:** Grouped form in `.card` sections (Units, Appearance/theme, etc.) with **visible labels** (`<label for>`), helper text, and proper input types; focus-visible rings.
- [ ] **Step 2:** Ensure the theme control writes `data-theme` + `localStorage('aurora-theme')` consistently with Task 7 (reuse the same mechanism; no divergent logic).
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — grouped labeled form; theme control matches header toggle; keyboard-navigable. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/settings/settings.component.ts
git commit -m "feat(settings): grouped labeled form with accessible controls

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 18: About

**Files:** Modify `weather-app/src/app/features/about/about.component.ts`.

- [ ] **Step 1:** Single calm content column with exactly one `<h1>`, brand story, and tech credits; `appReveal` on sections; `.btn-accent`/`.btn-outline-accent` for any CTA.
- [ ] **Step 2:** Confirm no other screen uses `<h1>` (section titles are `<h2>`); fix any duplicates found.
- [ ] **Step 3: Build verify** — `npm run build` → completes.
- [ ] **Step 4: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 5: Browser verify** — single-column about; one h1; reveal motion. Screenshot 360/768/1024/1440.
- [ ] **Step 6: Commit**

```bash
git add weather-app/src/app/features/about/about.component.ts
git commit -m "feat(about): calm single-column layout with single h1

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 19: Weather panel (shared)

**Files:** Modify `weather-app/src/app/shared/panel/weather-panel.component.ts`.

- [ ] **Step 1:** Restyle the shared panel to tokens/`.card` so it matches the new system (it appears on every screen via the shell).
- [ ] **Step 2: Build verify** — `npm run build` → completes.
- [ ] **Step 3: Test verify** — `npm test -- --watch=false` → green.
- [ ] **Step 4: Browser verify** — panel matches the new look on multiple screens. Screenshot.
- [ ] **Step 5: Commit**

```bash
git add weather-app/src/app/shared/panel/weather-panel.component.ts
git commit -m "feat(panel): restyle shared weather panel to design tokens

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 6 — Final review pass (brief §7 checklist)

### Task 20: Full-app audit & polish

**Files:** any needing fixes found during the audit.

- [ ] **Step 1: Grep for leftover neon/hard-coded colors**

Run (from repo root): search the `weather-app/src` tree for `#00d9ff`, `#ff006e`, `#76ff00`, `#b366ff`, `theme-light`, `glass-card` literal usages that should now be tokens/`.card`. Fix any found.

- [ ] **Step 2: Contrast matrix check** — for each of the 4 moods × 2 themes (8 combos), set `data-mood`/`data-theme` in console and confirm text/accent contrast looks ≥ AA on key screens (dashboard, current). Note any failures and adjust the offending token.

- [ ] **Step 3: Reduced-motion check** — enable "reduce motion" in the OS/DevTools rendering panel; confirm reveal/tilt/animations are disabled and content is fully visible.

- [ ] **Step 4: Responsive sweep** — dashboard, current, forecast, maps at 360/768/1024/1440: no horizontal scroll, nothing clipped, touch targets ≥44px.

- [ ] **Step 5: Console + build + tests clean** — `npm run build` completes; `npm test -- --watch=false` green; no console errors on any route.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A weather-app/src
git commit -m "fix(polish): final audit fixes — contrast, reduced-motion, responsive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 7 (optional): CodeRabbit / code-review** — if desired, run the `/code-review` skill on the branch now that git history exists.

---

## Self-review notes (author)

- **Spec coverage:** §2 → Tasks 1–2; §3 → Tasks 3–4; §4 → Tasks 7–8; §5 mood wiring → Tasks 5–6; §5 per-screen (10 screens) → Tasks 9–18 + shared panel Task 19; cross-cutting UX/SEO/checklist → Tasks 10–18 (states) + Task 20 (audit). All spec sections map to tasks.
- **Type consistency:** `Mood` type and `moodFor()`/`apply()` signatures defined in Task 5 are used as-is in Task 6; `accent()` helper defined in Task 9 is reused by Tasks 11/16 by reference. `RevealDirective`/`TiltDirective` selectors (`appReveal`/`appTilt`) consistent across all consuming tasks.
- **Placeholders:** none — every code step shows real code; per-screen "states" steps name the exact copy and the existing signals they bind to.
- **Known adaptation:** pure-CSS tasks use build+browser verification instead of unit tests (stated in Conventions); logic units (5,3,4) are TDD with real specs.
