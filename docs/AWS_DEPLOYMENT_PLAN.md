# Phase 2: AWS Deployment Plan (Docker + Terraform + EC2)

Status: **planning only** — nothing in this doc is implemented yet. Written per the original brief in `PLAN.md` ("इसी project के Docker containers बनेंगे, और उसको Terraform के through AWS पे एक EC2 instance बना के Docker compose के through मैं deploy करने वाला हूँ").

## Goal

Run TWS Roadmaps as a self-hosted Docker Compose stack on an AWS EC2 instance, provisioned via Terraform, as a second deployment target alongside (not replacing) the existing Vercel + Turso setup. Vercel stays the primary/production deployment; AWS is the Phase 2 exercise/alternative.

## Architecture

```
Terraform (AWS)
  └─ EC2 instance (Ubuntu, t3.small or similar)
       ├─ Security group: 22 (SSH, restricted to admin IP), 80/443 (HTTP/HTTPS)
       ├─ Elastic IP (stable address for DNS)
       └─ Docker + Docker Compose installed via user-data / cloud-init
            └─ docker-compose.yml on the instance:
                 ├─ app        — Next.js container (this repo, built from a multi-stage Dockerfile)
                 ├─ caddy/nginx — reverse proxy + TLS (Let's Encrypt) terminating on 443, proxying to `app`
                 └─ (database) — Turso stays remote (libSQL over HTTPS); no local Postgres/SQLite
                                  container needed since the app already targets Turso in production
```

Key decision: **keep Turso as the database even on AWS** — the app's `lib/db/client.ts` already targets it via env vars, so there's no migration needed. Running SQLite-on-EBS would reintroduce a single point of failure and lose the "same schema/queries everywhere" property `lib/db/client.ts` was built for. Revisit only if the user explicitly wants a fully self-hosted DB.

## Work items (in order)

1. **Dockerfile** (repo root, multi-stage):
   - `deps` stage: `npm ci`
   - `builder` stage: `npm run build` (needs `AUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` as build-time env or build with dummy values and inject at runtime — Next.js server components read env at request time, so runtime injection is preferred over baking secrets into the image)
   - `runner` stage: `next start` on a slim `node:22-alpine`, non-root user, only `.next/standalone` + `public` + `.next/static` copied in (enable `output: "standalone"` in `next.config.ts` first)
2. **docker-compose.yml** (for the EC2 host, not local dev):
   - `app` service built from the Dockerfile, env vars from a `.env.production` file not committed to git
   - `caddy` service (simplest for automatic Let's Encrypt) with a `Caddyfile` reverse-proxying `your-domain.com → app:3000`
3. **Terraform module** (`infra/aws/` in this repo):
   - Provider: `aws`, region configurable (default `ap-south-1` since Turso's nearest useful region and the user's likely locale)
   - Resources: VPC (or default VPC to keep it simple for Phase 2), security group, key pair (or use an existing one), one EC2 instance, an Elastic IP, optionally a Route53 record if a domain is available
   - `user_data` script: install Docker + Compose, clone this repo (or pull a pre-built image from GHCR/Docker Hub), write `.env.production` from Terraform-injected variables (via SSM Parameter Store or `sensitive` Terraform variables — **not** committed secrets), `docker compose up -d`
   - State: local `terraform.tfstate` for Phase 2 (single operator); revisit remote state (S3 + DynamoDB lock) if this becomes team-operated
4. **Secrets handling**: use AWS Systems Manager Parameter Store (free tier, no extra infra) to hold `AUTH_SECRET`/`TURSO_AUTH_TOKEN`, fetched by the EC2 instance's user-data script at boot via its IAM instance profile — avoids putting secrets in Terraform variables files or the AMI.
5. **CI/CD extension**: a new GitHub Actions workflow (e.g. `.github/workflows/deploy-aws.yml`), manually triggered (`workflow_dispatch`) rather than on every push to `main` — this is a secondary deployment target, not the primary release path. It would: build the Docker image, push to GHCR, SSH into the EC2 instance (via an AWS SSM Session, not raw SSH keys in Actions secrets, to avoid exposing a private key), and re-run `docker compose pull && docker compose up -d`.
6. **Docs**: a `docs/aws-runbook.md` covering how to `terraform apply`, how to rotate secrets, and how to tear down (`terraform destroy`) to avoid leaving billable resources running.

## Explicitly out of scope for now

- No Kubernetes/EKS — plain Docker Compose on one instance matches the original brief and Phase 2's stated scope.
- No multi-region/HA setup — this is a single EC2 instance, matching "एक EC2 instance" in the brief.
- No automatic deploy-on-push to AWS — stays manual (`workflow_dispatch`) so Vercel remains the always-current production URL and AWS doesn't risk double-deploying or drifting.

## Open questions before implementation starts

- Domain name for the AWS deployment (or is a bare Elastic IP / `nip.io`-style address acceptable for Phase 2)?
- AWS account/region preference, and whether an existing VPC/subnet should be reused instead of the default VPC.
- Budget/instance-size preference (t3.micro is free-tier eligible but may be tight for a Next.js build; building the image in CI and only running `docker compose up` on the instance avoids needing build-time resources there).
