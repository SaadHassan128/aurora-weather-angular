# Aurora Weather — "Beyond" Redesign Design Spec

**Date:** 2026-06-13
**Project:** Aurora Weather (Angular 21 SPA, `weather-app/`)
**Source brief:** `Skills/PORTFOLIO-DESIGN-BRIEF.md`
**Engagement type:** Full redesign — global design system + all 10 screens. Visuals + UX fixes (data/API untouched).

---

## 0. Context

Aurora Weather is an existing Angular 21 standalone-component SPA with lazy-loaded routes, OnPush change detection, and signals. It uses Bootstrap 5, Bootstrap Icons, Leaflet, and Chart.js (via ng2-charts). Data comes from the Stormglass weather API + Nominatim geocoding, with a **mock-data fallback** when the API fails so the UI always renders.

**Why redesign:** the current look is loud and "templated" — neon cyan (`#00d9ff`) + magenta (`#ff006e`) + purple + lime-green (`#76ff00`), gradient text-clip titles, a flat 10-link navbar. The brief's philosophy is the opposite: restraint, one (here: adaptive) soft accent, calm and premium.

**Stack track (brief Step 0):** Angular. We use components, directives for scroll-reveal/tilt, signals/effects for state, and an inline `<head>` bootstrap script for theme/mood. It remains an SPA — no SSG/prerender is added in this engagement (can be a later follow-up).

---

## 1. Locked decisions

| Decision | Choice |
|---|---|
| **Fonts** | Sora (headings) + Inter (body), Google Fonts with `preconnect` |
| **Palette** | Adaptive — 4 moods; accent + background glow only, surfaces stay neutral navy |
| **Layout** | Balanced bento grid across all screens |
| **Navigation** | Grouped top nav (primary visible + "More" menu), sliding active pill, scroll-shrink |
| **Motion / wow** | Subtle CSS-3D — tilt-on-hover, parallax depth, `.reveal`/`.reveal-3d`, reduced-motion safe. No WebGL. |
| **Scope** | Global system + all 10 screens |
| **Change boundary** | Visuals + UX fixes (may touch component logic for states/a11y); data, services, API, routing unchanged |

### Adaptive mood map
Set via `data-mood` on `<html>`:
- `clear` → amber `#ffb45a` (sunny / clear day)
- `clouds` → sky-blue `#38bdf8` (default; also snow / fog / mist fold here)
- `rain` → deep blue `#3b82f6` (rain / drizzle / storm)
- `night` → violet `#a78bfa` (whenever `isDay` is false)

Each mood drives `--accent`, `--accent-hover`, `--accent-contrast`, and the `--bg-glow` radial. Transitions eased (~.6s). Neutral surfaces (`--bg`, `--surface`, `--border`, `--text`) never change with mood.

---

## 2. Section 1 — Design system foundation (global `styles.scss`)

- **Neutral surface tokens:** `--bg #0a1428`, `--surface #16233f`, `--surface-2 #1b2c4d`, `--border #243450`, `--text #e8eef6`, `--text-muted #9fb3c8`. Plus semantic `--danger` / `--success` / `--warning` (calm, not neon).
- **Adaptive accent tokens:** defined per `data-mood` (see map above).
- **Light theme** via `data-theme="light"` — lighter surfaces, dark text, contrast re-checked independently.
- **Typography tokens:** `--font-heading: "Sora"`, `--font-body: "Inter"`; `--radius 12px`, `--radius-pill 999px`, `--maxw 1200px`, `--shadow`.
- **Components:** `.card` (bordered navy surface, soft shadow, hover-lift) replaces `.glass-card`; exactly two buttons — `.btn-accent` (solid) and `.btn-outline`.
- **Removed:** neon tokens, gradient text-clip section titles, magenta/lime accents.
- **Bootstrap:** kept as a layout/utility base but visually overridden by tokens; no hard-coded colors in components.
- **Theme + mood bootstrap:** inline `<head>` script sets `data-theme` (localStorage → `prefers-color-scheme`) and a default `data-mood="clouds"` before paint (no flash). All `localStorage`/`window`/`matchMedia` access browser-guarded.

## 3. Section 2 — Motion & interaction layer

- **`appReveal` directive:** `IntersectionObserver` wrapper; adds `.reveal` then `.reveal-visible` on intersect; optional index input → staggered delay `(i % 3) * 90ms`; one-shot (unobserves after reveal); no-ops if `IntersectionObserver` unavailable.
- **`.reveal` / `.reveal-3d`** CSS per brief (fade+rise; depth-tilt variant for hero/feature cards).
- **`appTilt` directive:** pointer-move sets `--rx`/`--ry` custom props for a few-degree tilt toward cursor; resets on leave; transform-only; disabled under reduced-motion and on touch.
- **Nav micro-interactions:** sliding active pill; scroll-shrink navbar after ~40px.
- **Card cue:** subtle "View details →" on interactive cards.
- **Reduced-motion guard:** global `@media (prefers-reduced-motion: reduce)` near-instant-disables animation/transition; reveal + tilt degrade to static.
- **Loading:** restyled skeleton screens (not bare spinners) for >300ms waits.

## 4. Section 3 — App shell & navigation

- **Shell:** fixed adaptive background (`--bg-glow` + navy gradient, `background-attachment: fixed`) on body/root; `<main id="main">` capped at `--maxw` with consistent vertical rhythm; existing loading/error regions restyled, `aria-live` preserved; `<app-weather-panel>` kept.
- **Header:** brand left; **primary** links Dashboard · Current · Forecast · Maps (sliding pill); **"More ▾"** dropdown for Search · Saved · Alerts · History; right cluster = debounced quick-search (existing logic) + theme toggle + refresh + settings/about icon.
- **Mobile:** state-driven drawer (existing `menuOpen` signal) with scroll-lock, closeable via tap-outside / Esc / link-tap; touch targets ≥44px; all links in drawer.
- **A11y:** single `<nav>` landmark, `aria-expanded`, `aria-current`, visible focus rings, keyboard-navigable dropdown + drawer.
- **Routing:** all 10 routes + lazy-loading unchanged.

## 5. Section 4 — Adaptive-mood wiring & per-screen redesign

- **MoodService (new, small):** maps current weather (`condition` + `isDay`) → `clear|clouds|rain|night`; sets `data-mood` on `<html>`. Driven by an effect in `WeatherStateService` on `currentWeather()` change; browser-guarded; defaults to `clouds`. This is the only behavioral addition.

**Per-screen (bento + tokens + reveal; services unchanged):**
- **Dashboard** — bento: current-hero + hourly-chart top row; forecast / alerts / saved+history below. Chart.js restyled to adaptive accent.
- **Current** — hero temp + metric-tile bento (feels-like, wind, humidity, UV, pressure, visibility, cloud); real empty/loading/error states.
- **Forecast** — day cards + hourly strip; chart restyled.
- **Maps** — Leaflet in a framed card; dark-theme controls/attribution; functionality kept.
- **Search** — prominent field, result cards with "add to saved" cue; empty + no-results states.
- **Saved** — location cards, hover-lift, open/remove; empty state.
- **Alerts** — severity via semantic danger color (not neon); "no active alerts" empty state.
- **History** — date picker + historical stats/chart bento; empty/loading states.
- **Settings** — grouped form (units, theme, …) with visible labels, helper text, focus management.
- **About** — single calm column, one `<h1>`, brand story.

**Cross-cutting UX fixes:** skeleton loading, empty states everywhere, semantic status colors, `alt` on weather icons, keyboard/focus states, no-overflow responsive at 360/768/1024/1440, `loading="lazy"` images.

**SEO:** keep/refine existing index.html meta/OG/Twitter/JSON-LD; per-page `<title>` already provided by Angular route config; enforce one `<h1>` per screen. No prerender added in this engagement.

---

## 6. Workflow (per brief §6, per screen)

Audit → (already chose direction) → plan tasks → implement against tokens → build + run + browser-verify + screenshot → self-review against brief §7 checklist → commit. Foundation (Sections 1–3 + MoodService) ships first so all screens inherit the system; then screens are redesigned one at a time, highest-impact first (Dashboard → Current → Forecast → others).

## 7. Out of scope

- Data model / API / service-layer changes (beyond MoodService reading existing data).
- SSG/prerendering, new backend, auth, new features/routes.
- WebGL / heavy 3D.

## 8. Risks / open items

- **Not a git repo.** The brief's `/code-review` and the per-section commit workflow need git. Decision pending: `git init` or proceed without version control.
- **Adaptive mood + light theme** must both pass contrast independently (8 combinations: 4 moods × 2 themes) — verified during implementation.
- **Bootstrap override surface** is large; risk of leftover Bootstrap defaults clashing with tokens — caught in per-screen browser verification.
