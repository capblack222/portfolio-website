# Portfolio Website — Design Doc

**Owner:** Nishtha Gupta
**Status:** Draft
**Date:** 2026-08-02

---

## 1. Goal

A dark, interactive developer portfolio that reads as *built by someone who can build*. The site itself is the first work sample: the interactions have to be smooth, accessible, and fast, not just flashy.

Three success tests:

1. A recruiter skimming for 20 seconds knows what you do and sees one project.
2. An engineer poking at it finds the motion work non-trivial and the Lighthouse score high.
3. It loads and is readable on a phone with reduced-motion enabled.

---

## 2. Information architecture

Single scrolling page with anchored nav. Project detail pages are separate routes so they're linkable and indexable.

| # | Section | Purpose | Notes |
|---|---------|---------|-------|
| 0 | Boot overlay | Set the tone | One-time per session, skippable |
| 1 | Hero | Name, one-line positioning, 2 CTAs | Pixel cursor field lives here |
| 2 | About | 2 short paragraphs, headshot optional | Keep under 90 words |
| 3 | Skills | Grouped by Languages / Frameworks / Data / Cloud | Proficiency shown as a pixel meter, not a fake percentage |
| 4 | Featured projects | 3 cards, filterable by tag | Each links to `/projects/[slug]` |
| 5 | Experience | Vertical timeline, expandable bullets | Metric-led bullets |
| 6 | Writing / awards | Optional, collapse if thin | Cut entirely if you have <2 items |
| 7 | Contact | Email, socials, optional form | Form posts to Resend or a mailto fallback |

Separate routes: `/projects/[slug]`, `/resume` (PDF redirect), `/404` (pixel easter egg).

**Deliberate omission:** no blog until you have three posts written. An empty blog costs more than it earns.

---

## 3. Visual system

### 3.1 Palette

Dark portfolios fail by being flat grey. Fix: three distinct surface levels plus a tight accent range.

```
--bg-void      #08080B   page background
--bg-surface   #0F0F14   cards, nav
--bg-raised    #17171E   hover states, code blocks
--border       #24242E   1px hairlines
--border-glow  #33334A   focused / active

--text-hi      #ECECF1   headings
--text-body    #A8A8B8   paragraphs
--text-mute    #7E7E92   captions, metadata (raised from #6B6B7B — see note)

--accent       #7C5CFF   primary — links, CTAs, focus rings (violet)
--accent-2     #35E0A1   terminal green — code, prompts, success
--accent-3     #FFB86B   amber — pixel trail sparks, highlights only
```

Rule: `--accent-3` never appears as text. It is motion-only, which is what keeps the palette from turning into a rainbow.

Measured contrast against `--bg-void`:

| Token | Ratio | Grade |
|---|---|---|
| `--text-hi` | 16.99 | AAA |
| `--text-body` | 8.53 | AAA |
| `--text-mute` | 5.04 | AA |
| `--accent-soft` (links) | 7.35 | AAA |
| `--accent` | 4.60 | AA |
| `--accent-2` | 11.74 | AAA |

`--text-mute` started at `#6B6B7B` and measured 3.82 — a fail for the 11px mono labels it's used on. Raised to `#7E7E92`. Worth noting because it's the exact trap dark themes set: the muted grey that looks right in Figma is usually illegal at small sizes.

Links use `--accent-soft` `#A78BFA` rather than `--accent` itself, since `--accent` only clears AA by a hair and link text is small.

### 3.2 Typography

- **Body / UI:** Geist Sans (or Inter Tight) — 16px base, 1.65 line height
- **Code / terminal:** JetBrains Mono — used for the boot sequence, section labels (`// 02 — about`), and metrics
- **Pixel accent:** Silkscreen — *only* for the logo mark, 404, and easter eggs. Pixel fonts at paragraph length are unreadable and look amateur.

Scale (fluid, `clamp()`): 12 / 14 / 16 / 20 / 26 / 34 / 48 / 68px.

### 3.3 Layout

- Max content width 1120px, 72ch for prose
- 8px spacing grid — matters because the cursor trail quantizes to the same grid, so motion and layout agree
- Faint 32px dot grid on `--bg-void` at 4% opacity, giving the pixel work something to sit on

---

## 4. Motion system

Three interactions, in priority order. All three obey `prefers-reduced-motion`.

### 4.1 Pixel cursor trail (hero + full-page overlay)

**What it is:** cursor drags a trail of 8px squares that fade and drift down, colors sampled from a violet → mint → amber ramp.

**Implementation**
- Single `<canvas>`, `position: fixed`, `pointer-events: none`, `z-index: 1`
- DPR-aware sizing; resize observer, not a window listener
- Mouse position captured on `pointermove`, but particles spawn inside a single `requestAnimationFrame` loop — never spawn in the event handler, that's what makes these effects stutter
- Positions snapped to an 8px grid so squares align with each other — this is what makes it read as *pixel art* rather than smoke
- Particle cap **180**, oldest recycled from a preallocated pool (no GC churn)
- Each particle: `{x, y, life, size ∈ {8,8,16}, hue}`; life decays 0.02/frame, alpha = life², size steps down at life thresholds
- Loop pauses on `document.hidden` and when the pointer has been idle >1s

**Disabled when:** coarse pointer (touch), `prefers-reduced-motion`, or `navigator.hardwareConcurrency <= 4`.

**Budget:** under 1.5ms per frame on a 2019 MacBook Air.

### 4.2 Terminal boot sequence

**What it is:** full-screen overlay, mono text typing out a short boot log, then a wipe to reveal the hero.

```
> initializing portfolio...
> loading profile: nishtha_gupta
> stack: [ ... ]
> status: open to opportunities
> render()
```

**Revised after first review:** it now runs as a true loading screen rather than an overlay that appears post-hydration, and holds for 5 seconds.

Making it cover the screen from the first paint required moving the decision out of React. A pre-paint inline script in `<head>` checks `sessionStorage`, reduced-motion, and viewport width, then adds a `.boot-skip` class to `<html>`. CSS covers the screen based on that class. React only drives the typing and the exit. This is the same technique dark themes use to avoid a white flash on load — React runs too late to prevent a flash of anything.

The overlay markup still ships in the server HTML *after* the real page content, so crawlers and no-JS visitors get the full page. A CSS `animation` fades the overlay out at 6s independently of JavaScript, so a JS failure can't trap a visitor behind a black screen.

**Open concern, recorded rather than resolved:** 5s is more than double the original cap. A visitor giving the site 20 seconds spends a quarter of it here, and bounce risk on a first paint that shows no content is real. `BOOT_MS` is a single constant in `terminal-boot.tsx` — worth testing 2000–3000 against it once the site is live.

**Rules that keep it from being annoying** — this is the single riskiest element on the site:
- **Hard cap at `BOOT_MS`**, enforced by a timer independent of the typing loop, plus the CSS failsafe above.
- Skippable by any key, click, or scroll. A `[press any key to skip]` hint appears at 400ms.
- Runs **once per session** (`sessionStorage`), not once per page load.
- Skipped entirely on reduced-motion and on viewports under 640px.
- The real page renders underneath the whole time, so the boot never blocks LCP.

Typing uses a per-character interval driven by rAF with a jitter of ±15ms — constant-speed typing reads as fake.

### 4.3 Scroll animations

- **Reveal:** `IntersectionObserver` at `rootMargin: -12%`, children stagger 60ms, translateY 16px + opacity. Fires once, then unobserves.
- **Section labels** type in mono when they enter view (`// 03 — projects`).
- **Scanline rail:** thin fixed left-edge progress bar in `--accent-2`, doubles as section nav.
- **Project cards:** subtle pointer-tracked tilt (max 6°) and a border-glow that follows the cursor. Disabled on touch.
- **Sticky nav:** appears after hero exits, backdrop-blur over `--bg-surface`.

**Anti-pattern to avoid:** no scroll-jacking, no full-page parallax, no reveal delays over 400ms. Those make a site feel slow, not premium.

---

## 5. Technical architecture

```
Next.js 15 (App Router) + TypeScript (strict) + Tailwind v4
Motion:  Framer Motion for layout/reveal, raw canvas for the trail
Content: local TypeScript data files (typed, not a CMS)
Forms:   Resend API route, honeypot + rate limit
Deploy:  Vercel, main branch auto-deploy
```

**Why local TS data files over MDX or a CMS:** you have maybe 6 projects. A CMS is infrastructure you'd maintain for no benefit, and typed data files give you compile-time errors when a project is missing a field.

### File structure

```
src/
  app/
    layout.tsx                 fonts, metadata, providers
    page.tsx                   composes the sections
    projects/[slug]/page.tsx   generateStaticParams from data
    api/contact/route.ts
  components/
    effects/
      pixel-cursor-trail.tsx   canvas overlay
      terminal-boot.tsx        boot overlay
      reveal.tsx               IntersectionObserver wrapper
      typewriter.tsx
    sections/
      hero.tsx  about.tsx  skills.tsx  projects.tsx
      experience.tsx  contact.tsx
    ui/
      nav.tsx  scanline-rail.tsx  project-card.tsx  tag-filter.tsx
  data/
    profile.ts  projects.ts  experience.ts  skills.ts
  hooks/
    use-reduced-motion.ts  use-pointer.ts  use-in-view.ts
  styles/
    globals.css              design tokens as CSS vars
```

---

## 6. Performance & accessibility budget

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 mobile |
| LCP | < 1.5s |
| CLS | < 0.02 |
| Total JS (gzip) | < 130KB |
| Canvas frame cost | < 1.5ms |

Accessibility, non-negotiable:

- Every animation respects `prefers-reduced-motion`
- Full keyboard navigation, visible `--accent` focus rings, skip-to-content link
- Boot overlay is `aria-hidden` with the real content live underneath
- Canvas is decorative, `aria-hidden="true"`
- Nothing conveyed by color alone

---

## 7. Build phases

1. **Scaffold** — Next.js, tokens, fonts, layout shell, deploy a blank dark page to Vercel
2. **Static sections** — all content sections, no motion, mobile-first. Site is fully usable here.
3. **Motion layer** — reveals → cursor trail → boot sequence, in that order
4. **Detail pages + contact** — project routes, form, OG images
5. **Polish** — Lighthouse pass, reduced-motion audit, keyboard audit, 404 easter egg

Phase 2 ends with a shippable site. Everything after is upside — which means you're never blocked on the fun parts being finished.

---

## 8. Content needed from you

I can scaffold with placeholders, but these are the blockers for a real site:

**Essential**

- One-line positioning: "I build ___ for ___" (this is the hero headline)
- 2–3 projects: name, 1-sentence pitch, 3 bullets on what you built, tech tags, repo/demo links
- Work/internship history: company, title, dates, 2–3 metric-led bullets each
- Skills, honestly grouped — list what you'd defend in an interview, not everything you've touched
- Email + GitHub + LinkedIn
- Resume PDF

**Nice to have**

- Headshot or an avatar you like
- Project screenshots or short screen recordings
- Education, awards, publications
- A domain name

---

## 9. Decisions

| Question | Decision |
|---|---|
| Accent color | Violet `#7C5CFF`. Nishtha may tweak later. |
| Contact | Form **and** a visible email link, side by side. |
| Hosting | **Vercel now**, custom domain attached. AWS migration deferred to phase 6. |
| Easter egg | Deferred to phase 5, not a blocker. |

### Hosting rationale

Vercel wins on time-to-live: zero config for Next.js, API routes work out of the box, free tier, and a custom domain is a DNS record plus an automatic cert. Recruiters judge the content, not the CDN.

The AWS work is still worth doing — just after the site is live, as a deliberate infrastructure project rather than a prerequisite.

### Phase 6 — AWS migration (later)

Target: OpenNext build → S3 + CloudFront, Lambda for SSR and the contact route, Route 53 for DNS, ACM for TLS, GitHub Actions for CI/CD, all defined in IaC (CDK or Terraform).

Why this and not Amplify: Amplify is a deploy button. Hand-wiring CloudFront behaviors, cache policies, and a Lambda origin is the version that gives you something to talk about in a systems interview. Keep the Vercel deploy alive during the migration and cut DNS over only once the AWS stack is verified.

---

## 10. Still blocked on

The hero headline and every content section need real facts about Nishtha's background — none exist in writing yet. See section 8 for the checklist. Scaffolding (phase 1) can proceed in parallel with placeholders.
