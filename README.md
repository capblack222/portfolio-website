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

**Colours** are CSS custom properties at the top of `styles.css`. Measured contrast against the paper background:

| Token | Ratio |
|---|---|
| `--ink` | 17.42 |
| `--body` | 9.58 |
| `--muted` | 5.08 |
| `--accent` | 6.70 |
| `--green` | 5.14 |

All clear WCAG AA. Light themes fail on muted greys specifically — if you lighten `--muted`, re-measure before shipping.

**Width** is one variable, `--wrap`, currently 1180px.

**The architecture diagram** is inline SVG with three CSS-animated squares. The animation is disabled under `prefers-reduced-motion`, and the SVG carries a `<title>` so it isn't silent to screen readers.

**Print:** Cmd+P produces a clean resume — nav, diagram, buttons, and form are hidden, layout collapses to one column, and link destinations are printed after the text since paper isn't clickable.

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
