# Portfolio Website — Design Doc

**Owner:** Nishtha Gupta
**Status:** Draft, awaiting approval
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
--text-mute    #6B6B7B   captions, metadata

--accent       #7C5CFF   primary — links, CTAs, focus rings (violet)
--accent-2     #35E0A1   terminal green — code, prompts, success
--accent-3     #FFB86B   amber — pixel trail sparks, highlights only
```

Rule: `--accent-3` never appears as text. It is motion-only, which is what keeps the palette from turning into a rainbow.

Contrast: `--text-body` on `--bg-void` = 8.1:1. `--accent` on `--bg-void` = 5.4:1. Both clear AA.

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

**Rules that keep it from being annoying** — this is the single riskiest element on the site:
- **Max 2.2 seconds.** Hard cap.
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

## 9. Open questions

1. **Accent color** — violet `#7C5CFF` is the proposal. Cyan and amber are the obvious alternatives.
2. **Contact form or just an email link?** A form is more work and more spam; a `mailto:` converts about as well.
3. **Custom domain**, or is `nishtha.vercel.app` fine for now?
4. **Do you want an easter egg?** e.g. typing `help` anywhere opens a real command palette. Fun, and a good interview story, but it's a phase-5 item.
