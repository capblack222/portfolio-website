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

**Terminal touches** are all CSS, no markup noise: the `$` before section labels and `~/` before the nav name are `::before` content, so screen readers get the label without the punctuation. The blinking block cursor after the name stops under `prefers-reduced-motion`.

**Print switches to serif and forces light**, whatever the screen theme. Monospace is the site's identity but it's wasteful on a page with a fixed budget.

**Width** is one variable, `--wrap`, currently 1180px.

**The architecture diagram** is inline SVG with three CSS-animated squares. The animation is disabled under `prefers-reduced-motion`, and the SVG carries a `<title>` so it isn't silent to screen readers.

**Print:** Cmd+P produces a resume of roughly one to one and a half pages.

The screen version earns attention with depth; paper has a hard budget, so printing *selects* rather than just shrinking. Two mechanisms:

- **`class="print-hide"`** on an element drops it and everything inside it. Currently applied to: the first about paragraph, planned certifications, the "also built" projects, the second-tier skills panel, the TIAA internship, publication and leadership, and the whole contact section.
- **Bullet caps** in `styles.css` keep the first 2 bullets per project and the first 4 per role:

  ```css
  .project .bullets li:nth-child(n + 3),
  .timeline .bullets li:nth-child(n + 5) { display: none; }
  ```

Add or remove `print-hide` in `index.html` to change what prints; change those two numbers to let more bullets through.

Because the contact section is hidden, a `print-only` line under the header carries your email and links. If you change your email, **update it in both places**.

Link destinations print after the text, since paper isn't clickable.

## Contact form

`main.js` posts to an API Gateway endpoint in front of a Lambda that calls SES.

Until you paste the endpoint into `ENDPOINT` in `main.js`, the form tells visitors to use the email link instead. Deliberate — a form that looks like it sent but didn't is worse than no form.

Setup is in [`infra/README.md`](infra/README.md).

## Deploying

Full runbook in [`infra/README.md`](infra/README.md). Short version:

```bash
aws s3 sync . s3://YOUR-BUCKET \
  --exclude ".*" --exclude "docs/*" --exclude "infra/*" \
  --exclude "legacy-nextjs/*" --exclude "README.md" --delete

aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/*"
```

Don't skip the invalidation — CloudFront caches for 24 hours and you'll think the deploy failed.

**Use CloudFront, not S3 static website hosting.** S3's website endpoints can't serve HTTPS on a custom domain.

## The old version

`legacy-nextjs/` holds the previous Next.js app — dark theme, pixel cursor trail, terminal boot sequence. Nothing was deleted; it also lives in git history. Delete the folder when you're sure you don't want it.
