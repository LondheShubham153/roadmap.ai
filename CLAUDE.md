@AGENTS.md

# TWS Roadmaps (formerly "Waypoint")

A roadmap.sh-style learning platform. Admins build tracks (**Subjects** → **Milestones/Topics** → **Subtopics**), like DevOps or Cloud Engineering. Learners sign up, follow a visual trail-map roadmap per track, and check off topics to track progress — including a job-readiness percentage broken into Fresher/Intermediate/Expert tiers.

Two-phase project (see `PLAN.md` for the original brief):
- **Phase 1 (done)**: Next.js on Vercel + Turso, GitHub Actions CI.
- **Phase 2 (in progress)**: fix production bugs, AWS deployment plan (Docker + Terraform + EC2), rebrand to "TWS Roadmaps".

## Stack

- **Framework**: Next.js 16 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui (custom "Waypoint" trail-map visual theme — warm paper/moss/amber palette, Fraunces + IBM Plex fonts; being rebranded to TWS Roadmaps, keep the visual system unless told otherwise)
- **Database**: Drizzle ORM. SQLite locally (`sqlite.db`, via `better-sqlite3`), **Turso** (libSQL) in production. `lib/db/client.ts` auto-switches based on whether `TURSO_DATABASE_URL` is set — same schema/queries either way.
- **Auth**: Auth.js (NextAuth v5), Credentials provider, bcrypt-hashed passwords, JWT sessions. Two roles: `admin` and `learner`, enforced in `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`).
- **Testing**: Vitest (`tests/*.test.ts`, pure-logic unit tests) + Playwright (`e2e/*.spec.ts`, browser smoke tests).
- **Deployment**: Vercel (production), Turso (database). GitHub Actions for lint/test/build CI.

## Data model (`lib/db/schema.ts`)

- `users` — id, name, email, passwordHash, role (`admin`|`learner`)
- `subjects` — a track (DevOps, Cloud Engineering), slug/title/description/color
- `topics` — belongs to a subject; `parentTopicId` (self-referencing) allows milestone → subtopic nesting; `level` = tree depth (`milestone`|`topic`|`subtopic`); `careerLevel` = job-readiness tier (`fresher`|`intermediate`|`expert`) — **do not confuse `level` and `careerLevel`, they are unrelated fields**
- `resources` — links attached to a topic (article/video/doc)
- `progress` — join table: which user completed which topic

Readiness math lives in `lib/readiness.ts` (`computeReadiness`) — pure and unit-tested (`tests/readiness.test.ts`). A topic tagged `fresher` counts toward every tier's required-topic set; `expert` only counts toward the expert tier.

## App structure

- `app/(public)/page.tsx` — landing page
- `app/tracks/[slug]/page.tsx` — **single shared route** for both public (read-only) and learner (interactive, checkboxes) views of a track — do NOT split this into separate route groups per role, that was tried and caused a routing conflict (two route groups both resolving to `/tracks/[slug]`)
- `app/(auth)/login`, `/signup`, `/admin/login` — auth pages, all client components using `useActionState` against server actions in `app/actions/auth.ts`
- `app/(learner)/dashboard/page.tsx` — per-track progress + readiness breakdown
- `app/(admin)/admin/*` — subject/topic/resource CRUD via server actions in `app/actions/admin.ts`
- `app/actions/*.ts` — server actions (`"use server"`), preferred over API routes for all mutations. Only real API route is `app/api/auth/[...nextauth]/route.ts`.
- `components/roadmap/roadmap-tree.tsx` — the trail-map visual (client component); topics render as a zigzag path; clicking a topic's info button opens a Dialog with description + resources
- `proxy.ts` — route guard. Matcher is `["/admin/:path*", "/dashboard/:path*"]`. **Known gotcha already hit once**: `/admin/:path*` also matches `/admin/login` itself, so the admin-role check must explicitly exclude `pathname === "/admin/login"` or it infinite-redirect-loops the login page to itself.

## Conventions

- Server actions over API routes for mutations.
- Pure logic extracted into small testable modules (`lib/slug.ts`, `lib/readiness.ts`) separate from the server actions that call them, specifically so they're unit-testable without a DB.
- Drizzle migrations: edit `lib/db/schema.ts`, run `npm run db:generate`, commit the generated SQL under `drizzle/`. Apply with `npm run db:migrate` (local SQLite) or `npx drizzle-kit migrate` with `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` set (production Turso).
- `lib/db/seed.ts` seeds sample DevOps + Cloud Engineering tracks and an admin account; DevOps topics carry real TrainWithShubham resources (YouTube channel-search links + trainwithshubham.com) — no fabricated per-topic video URLs.

## Workflow rules (from the user)

- **Never commit directly to `main`.** Always work on a feature branch and open a pull request. The user reviews the PR, GitHub Actions CI runs on it, and only a merge to `main` should trigger a Vercel deployment (Vercel's native Git integration, not a custom Action).
- Four project sub-agents live in `.claude/agents/` (`code-reviewer`, `linter`, `unit-tester`, `e2e-tester`) meant to run **in parallel** (one message, multiple `Agent` calls), not sequentially — invoke via the `/pre-pr` command before opening a PR.
- `.claude/commands/pre-pr.md` documents that parallel-invocation convention.

## Deployment details

- **Live URL**: https://roadmap-ai-neon.vercel.app (Vercel project `roadmap-ai`, org `shubham-londhes-projects-2ea14790`)
- **GitHub repo**: https://github.com/LondheShubham153/roadmap.ai (note: repo is named `roadmap.ai` with a dot, local directory is `roadmap-ai` with a hyphen — don't assume they match)
- **Turso DB**: project `roadmap-ai`, region `aws-ap-northeast-1`
- Production env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`) are already set on the Vercel project.
- CI: `.github/workflows/lint.yml` (ESLint + typecheck) and `.github/workflows/ci.yml` (Vitest + build) run on every PR/push to `main`.
- Vercel's native GitHub integration handles deploys once connected in the dashboard (Project → Settings → Git) — there is intentionally no custom GitHub Actions deploy workflow, to avoid double-deploying.

## Known issues / in-progress (Phase 2)

- Fixing the `/admin/login` redirect-loop bug (see `proxy.ts` gotcha above).
- Rebranding "Waypoint" → "TWS Roadmaps" across `app/layout.tsx`, `components/logo.tsx`, `app/(public)/page.tsx`, README, and the `.claude/agents/*.md` descriptions that mention the old name.
- AWS deployment plan (Docker + Terraform + EC2 + Docker Compose) — planning only for now, not executing.
