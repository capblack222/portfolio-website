# Portfolio — Nishtha Gupta

Static site. Plain HTML, CSS, and JavaScript. No framework, no build step, no dependencies.

## Running it

Double-click `index.html`. That's it — there's nothing to install and no server to start.

If you want a local server anyway (useful for testing the contact form's CORS):

```bash
python3 -m http.server 8000
```

## Files

```
index.html       all content and markup
styles.css       light theme + print stylesheet
main.js          ~80 lines: active nav link, contact form submit
infra/
  lambda/contact.mjs   SES handler for the contact form
  README.md            full AWS deployment runbook
docs/                  design doc from the earlier build
legacy-nextjs/         the previous Next.js version, kept for reference
```

## Editing content

Edit `index.html` directly. Content lives in the markup, not in a data file — for a site this size that's fewer moving parts, and it means search engines and no-JS visitors see everything.

**One `TODO` is outstanding:** the Graduate Assistant entry under experience has no bullet, because that role isn't on the master CV and nothing was inferred. Search `TODO` in `index.html`.

## Design notes

**Theme: terminal light**, monospace throughout with an amber accent, plus a dark mode.

**Colours** are CSS custom properties in one block at the top of `styles.css`. Nothing else in the file references a literal colour, so retheming means editing that block. Measured contrast:

| Token | Light | Dark |
|---|---|---|
| `--ink` | 16.26 | 16.02 |
| `--body` | 9.35 | 9.91 |
| `--muted` | 5.16 | 6.07 |
| `--accent` | 5.62 | 10.60 |

All clear WCAG AA in both modes. `--muted` is the one to re-check if you touch it — at 11px it's the first thing to fail, in either direction.

**Dark mode** works three ways: an inline script in `<head>` applies a saved choice before first paint (no flash), `prefers-color-scheme` picks the starting mode for anyone who hasn't chosen, and the nav button overrides and saves to `localStorage`. The button label names the mode you'd switch *to*.

**Terminal touches** are all CSS, no markup noise: the `$` before section labels and `~/` before the nav name are `::before` content, so screen readers get the label without the punctuation.

**Print switches to serif and forces light**, whatever the screen theme. Monospace is the site's identity but it's wasteful on a page with a fixed budget.

**Width** is one variable, `--wrap`, currently 1180px.

**The architecture diagram** is inline SVG with three CSS-animated squares. The animation is disabled under `prefers-reduced-motion`, and the SVG carries a `<title>` so it isn't silent to screen readers.

**Print** is minimal now — it forces light, hides the nav and form, and gets out of the way. The previous version tried to reformat the page into a one-page resume; that was the wrong tool, because a resume needs editorial selection that a stylesheet over a portfolio can't do well.

The real resume is the compiled LaTeX PDF. **Drop it at `assets/resume.pdf`** and the download link in the contact section starts working.

## Contact form

`main.js` posts to an API Gateway endpoint in front of a Lambda that calls SES.

Until you paste the endpoint into `ENDPOINT` in `main.js`, the form tells visitors to use the email link instead. Deliberate — a form that looks like it sent but didn't is worse than no form.

Setup is in [`infra/README.md`](infra/README.md).

## Deploying

Once set up, the whole process is:

```bash
git push origin main
```

GitHub Actions syncs to S3 and invalidates CloudFront. Live in about two minutes.

First-time setup is in [`infra/README.md`](infra/README.md) — bucket and CloudFront, then the deploy role, then the contact form. Two things worth knowing going in:

- **Use CloudFront, not S3 static website hosting.** S3's website endpoints can't serve HTTPS on a custom domain.
- **Authentication is OIDC, not access keys.** GitHub mints a short-lived token scoped to this repo's `main` branch; no long-lived secret exists to leak. Ten extra minutes, and it's the version worth explaining in an interview.

The workflow lives at `.github/workflows/deploy.yml`. It publishes a whitelist — `index.html`, `styles.css`, `main.js`, `assets/` — so nothing else in the repo can reach the bucket by accident.

## The old version

`legacy-nextjs/` holds the previous Next.js app — dark theme, pixel cursor trail, terminal boot sequence. Nothing was deleted; it also lives in git history. Delete the folder when you're sure you don't want it.
