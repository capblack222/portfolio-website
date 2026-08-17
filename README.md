# Portfolio — Nishtha Gupta

Dark, interactive developer portfolio. Next.js 16, TypeScript, Tailwind v4.

Design and animation spec: [`docs/portfolio-design-doc.md`](docs/portfolio-design-doc.md)

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000

> **First run:** if `npm install` errors, delete `node_modules` first — a partial install was left behind during scaffolding.

## Contact form

The form posts to `/api/contact`. Without env vars it returns 503 and the UI tells visitors to use the mailto link instead, so no message is ever silently dropped.

To enable delivery, create `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO_EMAIL=nish.gup.446@gmail.com
```

Sign up at [resend.com](https://resend.com) for the key. On Vercel, add both under Project Settings → Environment Variables.

## Editing content

All copy lives in typed files under `src/data/` — no CMS, no component edits needed.

| File | Holds |
|---|---|
| `profile.ts` | Name, headline, about, links, status badge |
| `projects.ts` | Projects, each led by engineering decisions rather than a feature list |
| `experience.ts` | Roles, bullets, education |
| `skills.ts` | Two tiers — `core` vs `building` |

TypeScript will flag a missing field at build time rather than rendering a blank section.

## Deploying

```bash
npm i -g vercel
vercel
```

Then attach the custom domain in the Vercel dashboard under Settings → Domains. Cert is automatic.

AWS migration is scoped as phase 6 in the design doc.

## Structure

```
src/
  app/
    layout.tsx           fonts, metadata, skip link
    page.tsx             composes sections
    globals.css          design tokens
    api/contact/route.ts validation, honeypot, Resend
  components/
    sections/            hero, about, projects, skills, experience, contact
    ui/section.tsx       Section, Container, Tag
  data/                  all content
```

## Motion

Three effects, all in `src/components/effects/`, all gated on `prefers-reduced-motion`.

| Effect | File | Turns itself off when |
|---|---|---|
| Pixel cursor trail | `pixel-cursor-trail.tsx` | Touch device, reduced motion, or 4 or fewer CPU cores |
| Terminal boot | `terminal-boot.tsx` | Reduced motion, viewport under 640px, or already played this session |
| Scroll reveals | `reveal.tsx` | Reduced motion, or no `IntersectionObserver` |

**The boot sequence plays once per browser session.** To see it again, hard-refresh in a new tab or clear `sessionStorage`:

```js
sessionStorage.removeItem("boot-played")
```

**The cursor trail needs a mouse.** It won't appear on a trackpad-free touch device, and it's deliberately disabled on low-core machines.

## Status

Phases 1–3 done: scaffold, tokens, all sections, and the full motion layer.

Phase 4 next: project detail pages at `/projects/[slug]`, OG images, 404 page.
