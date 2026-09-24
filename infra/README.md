# Deploying to AWS

Three parts, in order. Each works on its own — the site is live after Part 1, deploys become automatic after Part 2, and the contact form starts working in Part 3.

1. **Site hosting** — S3 + CloudFront + ACM + Route 53
2. **CI/CD** — GitHub Actions deploying on every push to `main`
3. **Contact form** — API Gateway + Lambda + SES

Values below are set to your real bucket (`gupnish-portfolio`), domain (`gupnish.dev`), distribution (`EVMHFON5NQJX1`) and its CloudFront domain.

`YOUR_ACCOUNT_ID` is left as a placeholder on purpose: this repository is public, and while an AWS account ID is not a credential, publishing it hands an attacker a free starting point for role-enumeration and phishing. Substitute it locally when you run the commands; don't commit it.

---

## Part 1 — Static site on S3 + CloudFront

### 1.0 Delegate DNS to Route 53

`gupnish.dev` is registered at **name.com** (free year via the GitHub Student Developer Pack, renews **18 Sep 2027**). The registration stays there; only DNS moves.

This step is unavoidable rather than a preference. CloudFront needs an **A record of type alias** at the bare apex `gupnish.dev`, and a plain CNAME is illegal at a zone apex. Route 53's alias record is AWS's answer to that; name.com has no equivalent.

Create the hosted zone:

```bash
aws route53 create-hosted-zone \
  --name gupnish.dev \
  --caller-reference "gupnish-$(date +%s)"
```

Read back the four nameservers:

```bash
aws route53 get-hosted-zone --id /hostedzone/YOUR_ZONE_ID \
  --query 'DelegationSet.NameServers' --output text
```

In name.com: **My Domains → gupnish.dev → Nameservers → Custom**, replace all four with the values above, save.

Propagation usually takes 15–60 minutes. Confirm:

```bash
dig +short NS gupnish.dev
```

When that returns the `awsdns` nameservers rather than name.com's, DNS has moved. **Don't start the certificate request until it has** — ACM validates by writing a record into the zone that is actually authoritative.

> Renewal: the free year ends 18 Sep 2027 and Student Pack domains don't auto-renew free. Put a reminder in your calendar — an expired domain takes the site down and frees the name for anyone.

> `.dev` is on the HSTS preload list, so every browser refuses plain HTTP on it, with no warning-and-continue. The site simply won't load until the certificate and CloudFront are live. That's expected, not a fault.

**Free alternative:** Cloudflare DNS supports CNAME flattening at the apex and costs nothing, versus Route 53's $0.50/month per zone. It works fine, it just moves one piece of your stack outside AWS.

### Why not S3 static website hosting

S3's website endpoints **cannot serve HTTPS on a custom domain**. Every recruiter's browser would show "Not secure." The correct setup is a private bucket with CloudFront in front using Origin Access Control, which also gives you a CDN and free TLS.

### 1.1 Bucket

Your bucket already exists. Confirm it is locked down:

```bash
aws s3api get-public-access-block --bucket gupnish-portfolio
```

All four values should be `true`. If not:

```bash
aws s3api put-public-access-block --bucket gupnish-portfolio \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

Keep Block Public Access **fully enabled**. CloudFront reaches the bucket through OAC, not through public reads.

### 1.2 First upload, by hand

Just to confirm the plumbing before automating it:

```bash
cd ~/Documents/projects/portfolio-website
aws s3 cp index.html s3://gupnish-portfolio/
aws s3 cp styles.css s3://gupnish-portfolio/
aws s3 cp main.js   s3://gupnish-portfolio/
aws s3 ls s3://gupnish-portfolio
```

### 1.3 Certificate

ACM, **region `us-east-1`** — CloudFront only reads certificates from that region regardless of where everything else lives. This is the single most common setup mistake: a cert issued in any other region simply won't appear in CloudFront's dropdown.

```bash
aws acm request-certificate \
  --domain-name gupnish.dev \
  --subject-alternative-names www.gupnish.dev \
  --validation-method DNS \
  --region us-east-1
```

In the ACM console, open the certificate and click **Create records in Route 53** — it writes the validation CNAMEs into your hosted zone. Status goes to `Issued` within a few minutes.

If it sits at `Pending validation` for more than ~15 minutes, DNS delegation from 1.0 hasn't finished. Re-check `dig +short NS gupnish.dev`.

### 1.4 CloudFront distribution

| Setting | Value |
|---|---|
| Origin | your S3 bucket (pick the **bucket**, not the website endpoint) |
| Origin access | Origin access control, create new, then **copy the bucket policy it offers** |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Default root object | `index.html` |
| Alternate domain names | `gupnish.dev`, `www.gupnish.dev` |
| Custom SSL certificate | the ACM cert from 1.3 |
| Compress objects | Yes |

Paste the generated bucket policy into S3 → Permissions → Bucket policy. Without it, CloudFront gets 403 from your own bucket.

Note the **distribution ID** (`E` followed by 13 characters) — Part 2 needs it.

### 1.5 DNS

Two **A records of type alias** pointing at the distribution. Alias, not CNAME — a CNAME is illegal at a zone apex.

Replace `d52d67pfig04u.cloudfront.net` with your distribution's domain name:

```bash
cat > alias.json <<'EOF'
{
  "Comment": "Point apex and www at CloudFront",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "gupnish.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d52d67pfig04u.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.gupnish.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d52d67pfig04u.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z02652213M2EAHBNBL4E8 \
  --change-batch file://alias.json
```

`Z2FDTNDATAQYW2` is not a typo and not your zone — it's the fixed, global hosted-zone ID that AWS uses for every CloudFront alias target. Same value for everyone.

Wait a few minutes, then load `https://gupnish.dev`.

---

## Part 2 — CI/CD with GitHub Actions

The workflow is already in the repo at `.github/workflows/deploy.yml`. It needs an AWS role it can assume and two values stored as secrets.

### Why OIDC instead of access keys

The obvious approach is to create an IAM user, generate an access key, and paste it into GitHub secrets. Don't. That key is long-lived, works from anywhere, and lives in a third party's database until you remember to rotate it.

GitHub can instead mint a short-lived OIDC token that AWS trades for temporary credentials scoped to one repository and one branch. **No secret key exists**, so none can leak. It's about ten extra minutes of setup and it's the version worth being able to explain in an interview.

### 2.1 Register GitHub as an identity provider

Once per AWS account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

If it already exists you'll get `EntityAlreadyExists` — that's fine, move on.

### 2.2 Create the deploy role

Save this as `trust-policy.json`, replacing the account ID:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:capblack222@66949977/portfolio-website@1319882383:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

That `sub` condition is the security boundary: **only** pushes to `main` in **that** repository can assume this role. A fork, a pull request, or another repo gets nothing. Use `StringEquals`, not `StringLike` with a wildcard — a trailing `*` here is how people accidentally let any branch deploy to production.

### The immutable subject format

Note the `@66949977` and `@1319882383` in the `sub` above. Those are the numeric GitHub owner ID and repository ID, and this account sends the **immutable** subject format rather than the plain `repo:owner/name:ref:...` shown in most tutorials.

If you copy the plain form from a guide, STS returns `Not authorized to perform sts:AssumeRoleWithWebIdentity` while every piece of your configuration looks correct — because it is correct, just not matching.

To find the real value, read what was actually presented rather than what you expect:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 1 --region us-east-1 \
  --query 'Events[0].CloudTrailEvent' --output text \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['userIdentity']['userName'])"
```

Use only the immutable form, not both. The plain form contains a repository *name*, and names can be released and re-registered — if you ever rename this repo, someone claiming the old name would match a trust policy that still accepts the mutable subject. The numeric IDs can't be reassigned.

```bash
aws iam create-role \
  --role-name github-portfolio-deploy \
  --assume-role-policy-document file://trust-policy.json
```

### 2.3 Give the role exactly what it needs

Save as `deploy-policy.json`, replacing the bucket name, account ID, and distribution ID:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::gupnish-portfolio"
    },
    {
      "Sid": "WriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::gupnish-portfolio/*"
    },
    {
      "Sid": "InvalidateCache",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/EVMHFON5NQJX1"
    }
  ]
}
```

```bash
aws iam put-role-policy \
  --role-name github-portfolio-deploy \
  --policy-name portfolio-deploy \
  --policy-document file://deploy-policy.json
```

Note what's *not* in there: no `s3:*`, no `cloudfront:*`, no access to any other bucket. If this role is ever misused, the blast radius is one bucket and one cache invalidation.

### 2.4 Store the two values in GitHub

Repository → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::YOUR_ACCOUNT_ID:role/github-portfolio-deploy` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `EVMHFON5NQJX1` |

Neither is a credential — the ARN is just a name, and the distribution ID is visible in your site's response headers anyway. They're secrets by convention, not necessity.

Also open `.github/workflows/deploy.yml` and set `S3_BUCKET` near the top to your bucket name.

### 2.5 Deploy

```bash
git add .
git commit -m "Add deploy workflow"
git push origin main
```

Watch it in the repository's **Actions** tab. From now on, `git push` is the entire deploy process.

### What the workflow does

1. Copies `index.html`, `styles.css`, `main.js`, and `assets/` into a `dist/` folder — a whitelist, so nothing new in the repo gets published by accident
2. Fails early if `index.html` is missing or doesn't contain your name
3. Assumes the AWS role via OIDC
4. Syncs assets with a 1-day cache, uploads `index.html` with `no-cache`
5. Invalidates the CloudFront cache
6. Writes a summary line to the run

The split cache headers matter: CSS and JS can sit in the CDN, but if `index.html` is cached then visitors keep seeing the old page even after the files behind it change.

### If a run fails

| Error | Cause |
|---|---|
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | The `sub` in the trust policy doesn't match your repo or branch exactly |
| `Access Denied` on sync | Bucket name mismatch between the workflow and the IAM policy |
| `InvalidDistributionId` | Wrong distribution ID in secrets |
| Deploy succeeds but the site is unchanged | Invalidation step skipped, or you're looking at a browser cache — hard-refresh |

---

## Part 3 — Contact form

### 3.1 Verify addresses in SES

SES starts every new account in **sandbox mode**: you can only send *to* verified addresses. Since you're sending to yourself, the sandbox is fine and you don't need production access.

Verify your address in SES → Identities. Use the same address for `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` until you own a domain.

### 3.2 Lambda execution role

Least privilege from the start: basic logging, plus `ses:SendEmail` scoped to the one verified identity — not `"Resource": "*"`.

```bash
cat > /tmp/lambda-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role --role-name portfolio-contact-lambda \
  --assume-role-policy-document file:///tmp/lambda-trust.json

aws iam attach-role-policy --role-name portfolio-contact-lambda \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

cat > /tmp/ses-send.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "ses:SendEmail",
    "Resource": "arn:aws:ses:us-east-1:YOUR_ACCOUNT_ID:identity/nishtha.gupta.446@gmail.com"
  }]
}
EOF

aws iam put-role-policy --role-name portfolio-contact-lambda \
  --policy-name ses-send --policy-document file:///tmp/ses-send.json
```

### 3.3 Package and create the function

```bash
cd ~/Documents/projects/portfolio-website/infra/lambda
zip -j /tmp/contact.zip contact.mjs

aws lambda create-function \
  --function-name portfolio-contact \
  --runtime nodejs22.x \
  --architectures arm64 \
  --handler contact.handler \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/portfolio-contact-lambda \
  --zip-file fileb:///tmp/contact.zip \
  --timeout 10 --memory-size 256 \
  --environment "Variables={CONTACT_TO_EMAIL=nishtha.gupta.446@gmail.com,CONTACT_FROM_EMAIL=nishtha.gupta.446@gmail.com,ALLOWED_ORIGIN=https://gupnish.dev}" \
  --region us-east-1
```

> If this fails with *"The role defined for the function cannot be assumed by Lambda"*, the role hasn't propagated yet. Wait ten seconds and re-run — IAM is eventually consistent, and this trips people constantly.

The handler is `contact.handler` because the file is `contact.mjs` and it exports `handler`.

### 3.4 API Gateway

Quick-create builds the integration, route, and auto-deploying `$default` stage in one call:

```bash
aws apigatewayv2 create-api \
  --name portfolio-contact-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:portfolio-contact \
  --route-key "POST /contact" \
  --cors-configuration AllowOrigins=https://gupnish.dev,AllowMethods=POST,OPTIONS,AllowHeaders=content-type,MaxAge=300 \
  --region us-east-1
```

The output returns two values that are easy to confuse:

| Field | Example | Used for |
|---|---|---|
| `ApiId` | `dy7tc7pcse` | every `aws apigatewayv2` command |
| `ApiEndpoint` | `https://dy7tc7pcse.execute-api.us-east-1.amazonaws.com` | the URL your site posts to |

`--api-id` wants the short ID. Passing the full endpoint gives you `NotFoundException: Invalid API identifier specified`.

**Grant API Gateway permission to invoke the function.** Quick-create does not reliably add this, and without it every request returns `500 Internal Server Error` with no Lambda logs at all — because the function is never invoked:

```bash
aws lambda add-permission \
  --function-name portfolio-contact \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:YOUR_API_ID/*/*/contact" \
  --region us-east-1
```

Verify with `aws lambda get-policy --function-name portfolio-contact`. The `source-arn` matters: without it, any API Gateway in any AWS account could invoke your function.

Then cap what a bot can cost you:

```bash
aws apigatewayv2 update-stage \
  --api-id YOUR_API_ID --stage-name '$default' \
  --default-route-settings ThrottlingBurstLimit=5,ThrottlingRateLimit=2 \
  --region us-east-1
```

**The CORS origin must match your site exactly** — scheme included, no trailing slash. `https://gupnish.dev` works; `gupnish.dev` or `https://gupnish.dev/` will fail preflight, and the browser reports it as a generic network error rather than anything useful.

### 3.5 Test before wiring it into the site

```bash
curl -i -X POST "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/contact" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"nishtha.gupta.446@gmail.com","message":"Testing the contact pipeline."}'
```

Expect `200` and `{"ok":true}`, and an email within a minute. **A missing log group is itself a diagnosis.** Lambda creates `/aws/lambda/portfolio-contact` on first invocation — if it doesn't exist after a request, the function never ran and the fault is upstream in API Gateway, not in your code.

To isolate Lambda from API Gateway, invoke it directly:

```bash
aws lambda invoke --function-name portfolio-contact \
  --cli-binary-format raw-in-base64-out \
  --payload '{"requestContext":{"http":{"method":"POST"}},"body":"{\"name\":\"T\",\"email\":\"nishtha.gupta.446@gmail.com\",\"message\":\"test\"}"}' \
  /tmp/out.json --region us-east-1 && cat /tmp/out.json
```

If that succeeds but the HTTP call doesn't, the problem is the invoke permission or the route. If it fails, read the logs:

```bash
aws logs tail /aws/lambda/portfolio-contact --since 5m --region us-east-1
```

Also confirm the honeypot and validation work — these should return 400 and 200-without-sending respectively:

```bash
# missing fields -> 400
curl -s -X POST "$ENDPOINT/contact" -H 'Content-Type: application/json' -d '{"name":"x"}'

# honeypot filled -> 200 but no email sent
curl -s -X POST "$ENDPOINT/contact" -H 'Content-Type: application/json' \
  -d '{"name":"x","email":"a@b.co","message":"y","company":"bot"}'
```

### 3.6 Wire it up

In `main.js`:

```js
var ENDPOINT = "https://dy7tc7pcse.execute-api.us-east-1.amazonaws.com/contact";
```

Commit and push. The pipeline deploys it. Submit the real form on gupnish.dev and confirm the email arrives.

---

## Cost

Roughly **$0.50–1.00/month** at portfolio traffic, almost all of it Route 53's $0.50 hosted zone fee. S3 storage is fractions of a cent, CloudFront and Lambda sit inside the always-free tier, SES is free for the first 3,000 messages, and GitHub Actions is free for public repositories.

The one way to get a surprise bill is an unthrottled public endpoint — set the throttle in 3.3.

---

## Checklist

- [ ] Site loads over `https://` on the custom domain
- [ ] `www` and apex both resolve, one redirecting to the other
- [ ] Bucket is **not** publicly readable — hit the direct S3 URL and confirm 403
- [ ] A push to `main` triggers a green Actions run
- [ ] A visible change appears on the live site within ~2 minutes of pushing
- [ ] A push to a non-`main` branch does **not** deploy
- [ ] Contact form sends and the email arrives
- [ ] A POST from an origin that isn't yours is rejected by CORS
- [ ] Lighthouse 95+ on mobile
