# Setup, how it works, and deployment

Everything needed to run this locally and get it live. Written to be followed top to bottom.

---

## 1. Prerequisites

| Need | Version | Check |
|---|---|---|
| Node.js | 20.9+ (22 LTS recommended) | `node -v` |
| npm | 10+ | `npm -v` |
| Git | any recent | `git --version` |

Next.js 16 will refuse to build on Node 18. If `node -v` shows 18 or lower, install Node 22 from [nodejs.org](https://nodejs.org) or via `nvm install 22 && nvm use 22`.

---

## 2. Run it locally

```bash
cd ~/Documents/projects/portfolio-website

# One-time: clear the partial install left behind during scaffolding
rm -rf node_modules package-lock.json

npm install

npm run dev
```

Open **http://localhost:3000**.

Edits to anything under `src/` hot-reload — no restart needed. Stop the server with `Ctrl+C`.

### Other commands

```bash
npm run build   # production build; run before deploying to catch errors early
npm start       # serve the production build locally
npm run lint    # eslint
npx tsc --noEmit  # type-check without emitting
```

### If something breaks

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'next'` | Partial install | `rm -rf node_modules && npm install` |
| `Failed to fetch ... from Google Fonts` | No network at build time | Reconnect; fonts are fetched during build, not at runtime |
| Port 3000 in use | Another dev server | `npm run dev -- -p 3001` |
| Types complain after editing `src/data/` | Missing required field | The error names the file and field — add it |

---

## 3. How the project works

### Rendering

The home page is a **React Server Component**. It renders to static HTML at build time and ships almost no JavaScript. Only `contact.tsx` is a client component (`"use client"`), because it holds form state.

That split is why the performance budget is achievable: the visitor downloads HTML and CSS, and JS only for the one interactive piece.

### Data flow

```
src/data/*.ts          typed content, single source of truth
      ↓  imported directly
src/components/sections/*.tsx    render it
      ↓  composed by
src/app/page.tsx       the page
```

To change any wording on the site, edit `src/data/`. You should never need to open a component to change copy. If a required field is missing, `npm run build` fails with the file and field named — a blank section can't ship silently.

### Styling

Design tokens live in `src/app/globals.css` inside Tailwind v4's `@theme` block. Declaring `--color-accent` there generates the `bg-accent`, `text-accent`, and `border-accent` utilities automatically.

To change the accent colour site-wide, edit one line:

```css
--color-accent: #7c5cff;
```

### Contact form

```
contact.tsx  →  POST /api/contact  →  validate → honeypot → Resend → your inbox
```

The route rejects empty fields, malformed emails, and messages over 4000 characters. A hidden `company` field acts as a honeypot: bots fill it, humans don't, and filled submissions are silently accepted without sending.

Without `RESEND_API_KEY` the route returns 503 and the form tells the visitor to use the mailto link. Deliberate — a form that appears to send but doesn't is worse than no form.

---

## 4. Wire up the contact form

1. Sign up at [resend.com](https://resend.com) — free tier covers 100 emails/day
2. Create an API key
3. Create `.env.local` in the project root:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO_EMAIL=nish.gup.446@gmail.com
```

4. Restart `npm run dev` — env vars load at startup, not on hot reload
5. Submit the form and confirm the email arrives

`.env.local` is gitignored. Do not commit it.

Until you verify a domain with Resend, mail sends from `onboarding@resend.dev`. Once you have your custom domain, verify it in Resend and update the `from` address in `src/app/api/contact/route.ts`.

---

## 5. Deploy to Vercel

The repo already points at `github.com/capblack222/portfolio-website`, so the GitHub route is the good one — every push deploys, and every branch gets its own preview URL.

### 5a. Push

```bash
cd ~/Documents/projects/portfolio-website

npm run build   # never push a build you haven't run

git add .
git commit -m "Portfolio scaffold: sections, tokens, contact route"
git push origin main
```

### 5b. Import

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub
2. Import `capblack222/portfolio-website`
3. Framework preset auto-detects as Next.js — leave build command, output directory, and install command untouched
4. Before clicking Deploy, expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your key |
   | `CONTACT_TO_EMAIL` | `nish.gup.446@gmail.com` |

   Apply to Production, Preview, and Development.
5. Deploy. First build takes 1–2 minutes.

You get `portfolio-website-<hash>.vercel.app`. It works immediately.

### 5c. Custom domain

In Vercel: **Project → Settings → Domains → Add**, enter your domain.

Vercel then shows the DNS records to create at your registrar:

| Record | Host | Points to |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Vercel displays the current values on that screen — use those, not these, if they differ.

Add the records at your registrar, then wait. DNS propagation is usually minutes but can take up to 48 hours. The TLS certificate is issued automatically once the records resolve; you do nothing for HTTPS.

Set one domain as primary and let Vercel redirect the other, so `www` and apex don't both index.

### 5d. Verify after deploy

- [ ] Site loads over `https://`
- [ ] All six sections render
- [ ] Contact form sends and the email arrives
- [ ] GitHub and LinkedIn links open correctly
- [ ] Readable on a phone
- [ ] Lighthouse in Chrome DevTools scores 95+ on Performance
- [ ] Enable Reduce Motion in macOS System Settings → Accessibility → Display, reload, confirm nothing breaks
- [ ] Tab through the whole page with the keyboard; focus is always visible

### 5e. Day-to-day after this

```bash
git add .
git commit -m "Update project copy"
git push
```

Vercel rebuilds and deploys within about a minute. Push to a branch instead of `main` to get a preview URL without touching production.

---

## 6. AWS, later

Phase 6 in the design doc. Target: OpenNext build → S3 + CloudFront, Lambda for SSR and the contact route, Route 53 for DNS, ACM for TLS, GitHub Actions for CI/CD, all in Terraform.

Keep the Vercel deploy running throughout and cut DNS over only after the AWS stack serves the site correctly. That way a broken deploy never means a dead portfolio during application season.

Worth doing for the interview story — hand-wiring CloudFront behaviours and cache policies is real systems work. Worth doing *after* the site is live, not before.
