# Waypoint

A learning-roadmap website: admins build tracks (Subjects → Milestones → Topics/Subtopics) like DevOps or Cloud Engineering, and learners create an account, follow the trail, and check off milestones as they complete them.

Built with Next.js App Router, TypeScript, Tailwind v4 + shadcn/ui, Drizzle ORM (SQLite locally, Turso in production), and Auth.js.

## Getting started

```bash
npm install
cp .env.example .env.local   # generates one AUTH_SECRET; edit values as needed
npm run db:migrate
npm run db:seed              # creates sample DevOps + Cloud Engineering tracks and an admin user
npm run dev
```

Seed admin login defaults to `admin@roadmap.ai` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local` before seeding).

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Learner signup: http://localhost:3000/signup

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:generate` | Generate a Drizzle migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the local SQLite file |
| `npm run db:seed` | Seed sample tracks + admin user |
| `npm run db:studio` | Open Drizzle Studio |

## Database: local vs. production

`lib/db/client.ts` picks the driver based on env: if `TURSO_DATABASE_URL` is set it connects to Turso (libSQL), otherwise it opens a local SQLite file at `SQLITE_PATH` (default `sqlite.db`). Same schema, same queries — only the connection changes.

## Deployment (Phase 1)

Deployed to Vercel via GitHub Actions:

- `.github/workflows/ci.yml` — lint, typecheck, unit tests, build on every PR and push to `main`.
- `.github/workflows/deploy.yml` — deploys to Vercel production on push to `main`.

Required repo secrets: `VERCEL_TOKEN` (and a linked `.vercel/project.json`, or `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`). Required production env vars (set in Vercel): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`.

## Sub-agents (parallel dev workflow)

`.claude/agents/` defines four single-purpose agents — `code-reviewer`, `linter`, `unit-tester`, `e2e-tester` — with no overlapping concerns, so they can run **in parallel** instead of one after another. Run `/pre-pr` before opening a pull request to fire all four at once against your current changes.

## Phase 2 (later)

Containerize with Docker, provision an EC2 instance with Terraform, and deploy via Docker Compose — see `PLAN.md`.
