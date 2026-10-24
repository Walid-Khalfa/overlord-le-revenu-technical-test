# Communauté Le Revenu — technical test

Full-stack community space for the readers of *Le Revenu*, built for the developer
technical test: a screen of the supplied HTML prototype
(`maquette-communaute-le-revenu.html`) transformed into a structured, maintainable
application — **Next.js (App Router)** for the frontend, **Strapi v5** for the
backend and business logic, **PostgreSQL** for persistence.

> All business logic and persistence go through Strapi. Next.js never accesses
> PostgreSQL directly and implements no parallel business backend.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Strapi v5 (5.59.0), TypeScript, REST API, Users & Permissions |
| Database | PostgreSQL 16 (Docker Compose) |
| Tests | Node.js built-in test runner (API) · Playwright (E2E journeys) |

## Repository structure

```
frontend/                      Next.js 16 app
  app/                         routes: community feed, discussion detail, /publier
    actions/                   server actions (login, logout, create discussion/reply)
  components/                  UI ported from the mockup (cards, forms, member panel…)
  lib/
    strapi.ts                  typed Strapi REST client (single integration point)
    community.ts               data layer: cached reads + write helpers
    auth.ts                    httpOnly session-cookie helpers
  e2e/                         Playwright journeys
  proxy.ts                     real-404 handling for unknown discussion ids
backend/                       Strapi v5 project
  src/api/{category,discussion,reply}/   controllers, services, routes
  src/utils/                   seed.ts (demo data), serialize.ts, validation.ts
  tests/                       automated API tests + cleanup-ph5.sql
  types/generated/             Strapi-generated TypeScript types
docker-compose.yml             PostgreSQL service (the only container)
maquette-communaute-le-revenu.html   original prototype (visual reference)
Test_technique_*.pdf           original assessment brief
docs/                          acceptance matrix + technical-review plan
```

## Prerequisites

- Docker Desktop (Compose v2)
- Node.js ≥ 20.19 with npm ≥ 10 (development was done on Node 24)
- A local port free on **5432** (PostgreSQL), **1337** (Strapi) and **3000** (Next.js)

## 1. Environment configuration

Copy the three templates — the real files must never be committed:

```sh
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

(On Windows PowerShell, `cp`/`Copy-Item` behave the same.)

Then fill in the `change-me` values:

| File | Variable | Value |
|---|---|---|
| `.env` | `POSTGRES_PASSWORD` | any strong local password |
| `backend/.env` | `APP_KEYS` | 4 comma-separated random strings |
| `backend/.env` | `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | random strings |
| `backend/.env` | `DATABASE_PASSWORD` | same value as `POSTGRES_PASSWORD` |
| `backend/.env` | `SEED_DEMO_DATA` | `true` (runs the idempotent demo seed at boot) |
| `backend/.env` | `SEED_USER_PASSWORD` | a demo-only member password |
| `frontend/.env.local` | `NEXT_PUBLIC_STRAPI_URL` | `http://localhost:1337` |

Generate random values with, for example:

```sh
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Optional frontend flags: `COOKIE_SECURE=true` once the app is served over HTTPS
(localhost needs it to stay `false` — browsers refuse secure cookies over http).

## 2. PostgreSQL via Docker Compose

```sh
docker compose up -d
docker compose ps        # le-revenu-postgres should reach "healthy" (pg_isready)
```

The first start creates the `pgdata` volume and the `le_revenu` database.
The Compose file only exposes ports and storage — no application services run inside it.

## 3. Strapi backend

```sh
cd backend
npm ci          # or npm install
npm run develop # http://localhost:1337
```

First boot: PostgreSQL gets its schema (Relations/create… Strapi v5 document store)
and, because `SEED_DEMO_DATA=true` in the environment, the idempotent demo seed of
`src/utils/seed.ts` creates only what is missing:

- **11 thematic categories** (Bourse, Économie, Épargne…)
- **3 demo members**: `demo_marie`, `demo_paul`, `demo_sophie`
- **6 demo discussions with 5 replies**

Re-running `npm run develop` re-checks and never duplicates (safe on existing data).
No Strapi admin panel is bootstrapped — the assessment needs none.

Useful check (Strapi health):

```sh
curl -i http://localhost:1337/_health   # 204 No Content
```

## 4. Next.js frontend

```sh
cd frontend
npm ci          # or npm install
npm run dev     # http://localhost:3000
```

Production check:

```sh
npm run build && npm start
```

## 5. Demo authentication (without publishing any password)

Publishing a discussion or a reply requires being logged in as a member
(the backend refuses anonymous writes). Log in through the **Espace membre**
panel rendered on every page:

- identifiers: `demo_marie`, `demo_paul` or `demo_sophie` (lowercase, with underscore);
- password: the value you set for `SEED_USER_PASSWORD` in `backend/.env`
  (matching default documented once, in the backend source, `src/utils/seed.ts`).

The session is a Strapi-issued JWT kept in an **httpOnly** cookie — it is never
readable by browser JavaScript, and the author of every submission is derived
server-side from that token.

## Application features

- **Community feed** (`/`): discussions straight from Strapi — title, author,
  category, reply count, publication date — with category filtering (`?espace=…`)
  and the mockup's sort tabs (`?tri=…`, Tendances / Récentes / Sans réponse)
  plus empty states and skeletons.
- **Discussion detail** (`/discussions/<documentId>`): clean URL per discussion,
  full content with associated replies, reply publication persisted in PostgreSQL via Strapi.
- **Creation** (`/publier`): type (question/discussion), title ≥ 10 characters,
  required content, category selection — instant client validation mirroring the
  Strapi rules, server-side re-validation, then redirect to the new discussion.
- **Minimal secure session**: login/logout server actions, httpOnly cookies,
  backend permission matrix enforced by Strapi.

## Backend architecture & security decisions

- **Content types** (Strapi v5): `Category` (name, slug, description),
  `Discussion` (title, content, type, author → user; category; replies → reply),
  `Reply` (content, author → user; discussion → discussion). The user entity is
  the native Users & Permissions model.
- **Custom controllers** on `discussion` and `reply` (creation + list/find-one):
  author is always taken from the JWT, never from the payload; relations are
  populated in an optimized way and serialized flat (documentId + only safe user
  fields: `id` and `username` — never email/provider/password); consistent HTTP
  errors (400 with per-field messages, 403 for unauthorized writes, 404 unknown).
- **Validation** runs on Strapi (`title` 10–150, `content` required, type enum,
  category must exist, reply ≥ 2 characters) — independent of the frontend checks.
- **Permissions** are configured in Strapi, not app-side:
  public role = read only (find/find-one); authenticated role = read + create
  discussion/reply; **no update and no delete** for anyone.
- **Frontend data access**: a single typed client (`lib/strapi.ts`); reads are
  cached (`use cache` + `cacheTag('community')`, refreshed by the write actions
  with `updateTag`); every URL parameter (category/sort) is translated into a
  backend query (`filters`, `sort`, `pagination`).
- **Session**: server actions set the httpOnly JWT cookie; every page rendering
  parts that depend on the session does it behind a Suspense boundary
  (Cache Components-ready code).

## Automated tests

Prerequisites: sections 2–4 running (PostgreSQL healthy, Strapi on 1337, Next dev on 3000).

Backend (Node built-in runner — zero extra dependency):

```sh
cd backend
npm test   # 23 tests: validation, 403s, author spoofing, replies, security regressions
```

E2E journeys (Playwright):

```sh
cd frontend
npx playwright test   # 5 scenarios = the 10 mandatory journeys
```

Mobile layout check (390×844: no horizontal overflow, bottom nav, hidden sidebar):

```sh
cd frontend
node e2e/mobile-check.mjs
```

Both suites create only rows marked `[PH5TEST]` / `[E2E-PH5-…]`.

## Database cleanup procedure (test fixtures)

After running the suites, the marked rows can be removed without touching seed
data, demo rows or anything else:

```sh
Get-Content backend/tests/cleanup-ph5.sql | docker compose exec -i postgres psql -U strapi -d le_revenu
```

(or the bash equivalent: `docker compose exec -i postgres psql -U strapi -d le_revenu < backend/tests/cleanup-ph5.sql`).

The script is idempotent and transactional. Suggested verification afterwards:

```sh
docker compose exec -T postgres psql -U strapi -d le_revenu -tAc \
  "SELECT (SELECT count(*) FROM categories), (SELECT count(*) FROM discussions), (SELECT count(*) FROM replies)"
```

## Known limitations & possible improvements

- **“Tendances” / “Sans réponse” tabs**: the category filter, base ordering and
  pagination are executed by the backend; the two mockup-derived tabs are then
  derived from the populated replies of the fetched page (Strapi v5 REST has no
  native sort/filter on relation counts — future phase could add a dedicated endpoint).
- **Pagination**: the backend passes pagination through (`pageSize` 25) but the
  feed shows one page — true infinite scrolling/pagination is a bonus item.
- **Search, votes “Utile”, user profiles**: bonus items, intentionally not implemented
  (the brief gives the core scope priority).
- **Admin panel**: not bootstrapped (not required by the assessment); permission
  menu changes would go through the admin.
- **Local HTTPS**: the `secure` cookie flag stays opt-in for plain-localhost demos.
- **Docker networking on some Windows hosts**: when Docker's default address pools
  are exhausted, `docker compose up` may fail to create the project network —
  recreating Docker's `default-address-pools` configuration is a host-level fix.
- Strapi regenerates `backend/types/generated/*.d.ts` on boot; ignore EOL-only churn.
