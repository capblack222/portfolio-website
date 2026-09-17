# Deploying to AWS

Two independent pieces:

1. **The site** — S3 + CloudFront + ACM + Route 53
2. **The contact form** — API Gateway + Lambda + SES

Do them in that order. The site works without the form.

---

## Part 1 — Static site on S3 + CloudFront

### Why not S3 static website hosting

S3's website endpoints **cannot serve HTTPS on a custom domain**. Every recruiter's browser would show "Not secure." The correct setup is a private bucket with CloudFront in front using Origin Access Control, which also gives you a CDN and free TLS.

### 1.1 Bucket

```bash
aws s3 mb s3://nishtha-portfolio --region us-east-1
```

Leave Block Public Access **fully enabled**. CloudFront reaches the bucket through OAC, not through public reads.

### 1.2 Upload

```bash
cd ~/Documents/projects/portfolio-website

aws s3 sync . s3://nishtha-portfolio \
  --exclude ".*" \
  --exclude "docs/*" \
  --exclude "infra/*" \
  --exclude "legacy-nextjs/*" \
  --exclude "README.md" \
  --delete
```

Check what landed:

```bash
aws s3 ls s3://nishtha-portfolio --recursive
```

You should see exactly `index.html`, `styles.css`, `main.js`, and anything in `assets/`.

### 1.3 Certificate

ACM, **region `us-east-1`** — CloudFront only reads certificates from that region regardless of where everything else lives.

Request a public certificate for `nishtha.dev` and `www.nishtha.dev`, validate by DNS, and let ACM create the CNAME records if Route 53 hosts your domain.

### 1.4 CloudFront

Create a distribution:

| Setting | Value |
|---|---|
| Origin | your S3 bucket (pick the **bucket**, not the website endpoint) |
| Origin access | Origin access control, create new, then **copy the bucket policy it offers** |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Default root object | `index.html` |
| Alternate domain names | `nishtha.dev`, `www.nishtha.dev` |
| Custom SSL certificate | the ACM cert from 1.3 |
| Compress objects | Yes |

Paste the generated bucket policy into S3 → Permissions → Bucket policy. Without it CloudFront gets 403 from your own bucket.

### 1.5 DNS

In Route 53, two **A records, alias type**, pointing at the CloudFront distribution:

- `nishtha.dev` → distribution
- `www.nishtha.dev` → distribution

Alias records, not CNAMEs — a CNAME cannot sit at the apex of a domain.

### 1.6 Redeploying

```bash
aws s3 sync . s3://nishtha-portfolio --exclude ".*" --exclude "docs/*" \
  --exclude "infra/*" --exclude "legacy-nextjs/*" --exclude "README.md" --delete

aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

**The invalidation is not optional.** CloudFront caches for 24 hours by default, so without it your changes are invisible and you will think the deploy failed. The first 1,000 invalidation paths per month are free.

---

## Part 2 — Contact form

### 2.1 Verify addresses in SES

SES starts every new account in **sandbox mode**: you can only send *to* verified addresses. Since you are sending to yourself, the sandbox is fine and you do not need production access.

Verify your address in SES → Identities. You will get a confirmation email. Use the same address for both `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` until you own a domain.

### 2.2 Lambda

Create a function:

- Runtime **Node.js 22.x**
- Architecture `arm64` (cheaper, same speed here)
- Paste `lambda/contact.mjs` into the editor, or zip and upload

The AWS SDK v3 ships with the runtime, so there is nothing to install.

Environment variables:

```
CONTACT_TO_EMAIL    = nishtha.gupta.446@gmail.com
CONTACT_FROM_EMAIL  = nishtha.gupta.446@gmail.com
ALLOWED_ORIGIN      = https://nishtha.dev
```

Attach this inline policy to the function's execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}
```

Scope `Resource` to your verified identity ARN once it is stable — least privilege is the point of doing this yourself rather than clicking a managed policy.

### 2.3 API Gateway

Create an **HTTP API** (not REST — cheaper and simpler):

- Route: `POST /contact` → Lambda integration
- CORS: allow origin `https://nishtha.dev`, header `content-type`, methods `POST` and `OPTIONS`

Copy the invoke URL.

### 2.4 Wire it up

In `main.js`:

```js
var ENDPOINT = "https://abc123.execute-api.us-east-1.amazonaws.com/contact";
```

Re-sync and invalidate. Submit the form and confirm the email lands.

### Throttling

On the API's Default Route Settings, set burst 5 and rate 2 requests/second. A portfolio form never needs more, and it caps what a bot can cost you.

---

## Cost

At portfolio traffic this runs at roughly **$0.50–1.00/month**, almost all of it Route 53's $0.50 hosted zone fee. S3 storage is fractions of a cent, CloudFront and Lambda sit inside the always-free tier, and SES is free for the first 3,000 messages.

The one way to get a surprise bill is an unthrottled public endpoint. Set the throttle in 2.4.

---

## Checklist

- [ ] Site loads over `https://` on the custom domain
- [ ] `www` and apex both resolve, one redirecting to the other
- [ ] Bucket is **not** publicly readable — try the direct S3 URL and confirm 403
- [ ] Contact form sends and the email arrives
- [ ] CORS rejects a POST from an origin that is not yours
- [ ] Cmd+P produces a clean resume
- [ ] Lighthouse 95+ on mobile
