# Services Dashboard

An internal dashboard that gives each environment a single view of its services
— their links (repo, logs, Swagger, …), owner, and deployed-version status —
driven by an editable, versioned configuration. Includes cookie-based auth with
a role hierarchy and an admin area for user management, the config editor, and
an audit log. Bootstrapped with the [T3 Stack](https://create.t3.gg/).

## What it does

- **Environments & services** — browse environments, each listing its services
  with icon links, owner, and a version badge comparing the deployed version to
  a reference (newer / same / older / unknown). Filter services by name, owner,
  and version status.
- **Versioned configuration** — the whole dashboard is rendered from one JSON
  `AppConfig` (environments, services, links, per-environment variables with
  `${placeholder}` substitution). Every save appends a new version; admins can
  view history, diff versions, and revert from the config editor.
- **Per-user secrets** — users can store personal secrets (e.g. a Jenkins API
  token) the backend uses to reach upstream systems. Encrypted at rest with
  AES-256-GCM and never returned to the client.
- **Auth & roles** — self-registration, encrypted-cookie sessions, and a
  three-tier role hierarchy gating the admin area.

## Tech stack

| Area               | Library                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | [Next.js 15](https://nextjs.org) (App Router, React 19, Turbopack dev)  |
| UI                 | [Chakra UI v3](https://chakra-ui.com) + [next-themes](https://github.com/pacocoursey/next-themes) for light/dark |
| API layer          | [tRPC v11](https://trpc.io) with [React Query](https://tanstack.com/query) and [superjson](https://github.com/blitz-js/superjson) |
| Database / ORM     | [Prisma 6](https://prisma.io) on MongoDB                                 |
| Auth & sessions    | [iron-session](https://github.com/vvo/iron-session) (encrypted cookies) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing |
| Forms & validation | [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) (via `@hookform/resolvers`) |
| Config editor      | [Monaco](https://github.com/suren-atoyan/monaco-react)                  |
| Env validation     | [@t3-oss/env-nextjs](https://env.t3.gg)                                 |
| Tooling            | TypeScript, ESLint, Prettier, [Vitest](https://vitest.dev)              |

> **Styling convention:** UI is built with Chakra UI. If a use case has no
> Chakra component, a custom component is introduced explicitly rather than
> reaching for raw CSS or another library.

## Getting started

### Prerequisites

- Node.js 20+
- npm 11+
- MongoDB **running as a replica set** — required by the Prisma MongoDB connector
  (it wraps writes in transactions). A free [MongoDB Atlas](https://www.mongodb.com/atlas)
  cluster already is one. For local development, the bundled Compose file starts a
  single-node replica set and initiates it automatically:
  ```bash
  docker compose up -d
  ```
  It listens on **port 27018** (not the default 27017, so it never collides with a
  test database) and is reached with `?directConnection=true` — see `.env.example`.

### Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Create your local env file
cp .env.example .env
```

Set the following variables in `.env`:

| Variable                 | Description                                                              |
| ------------------------ | ----------------------------------------------------------------------- |
| `DATABASE_URL`           | MongoDB connection string with a db name, e.g. `mongodb://localhost:27018/dashboard?directConnection=true` or an Atlas `mongodb+srv://…/dashboard` URL |
| `SESSION_SECRET`         | Secret used to encrypt session cookies — **min. 32 chars**              |
| `SECRETS_ENCRYPTION_KEY` | Base64 of 32 random bytes (~44 chars); encrypts per-user secrets at rest |

```bash
# 3. Apply the schema to a fresh database
npm run db:push

# 4. Start the dev server (http://localhost:3000)
npm run dev
```

### First run (seeding)

On a fresh database, the app seeds itself on startup (via the Next.js
`instrumentation` hook → [`src/server/bootstrap.ts`](src/server/bootstrap.ts)),
idempotently — it does nothing once data exists:

- A default super-admin: **`admin` / `admin`** (change this after first login).
- Example users for testing: `user1..5@example.com` (USER) and
  `admin@example.com` (ADMIN), all with password `password`.
- Initial configuration (version 1) from
  [`config/default-config.json`](config/default-config.json).

## Roles & permissions

Three roles form a strict hierarchy, defined as a single source of truth in
[`src/lib/roles.ts`](src/lib/roles.ts):

| Role          | Rank | Label       | Badge color |
| ------------- | ---- | ----------- | ----------- |
| `USER`        | 0    | User        | green       |
| `ADMIN`       | 1    | Admin       | orange      |
| `SUPER_ADMIN` | 2    | Super admin | red         |

Checks are hierarchical via `hasMinRole(role, min)` and enforced in three places:

1. **Edge middleware** ([`src/middleware.ts`](src/middleware.ts)) — `/admin/*`
   requires `ADMIN`+; unauthenticated users are redirected to `/login`.
2. **tRPC procedures** ([`src/server/api/trpc/procedures.ts`](src/server/api/trpc/procedures.ts)) —
   `protectedProcedure` requires a session; `adminProcedure` requires `ADMIN`;
   `superAdminProcedure` requires `SUPER_ADMIN`.
3. **UI** — components use `ROLE_META` / `hasMinRole` to show or hide controls.

**What each role can do:**

- **User** — full dashboard access (environments, services, own secrets); no
  admin area.
- **Admin** — the above, plus the admin area: edit the configuration, view the
  user list, and browse the changelog.
- **Super admin** — everything admins can, plus managing other users: change
  roles, reset passwords, and delete users (you cannot delete your own account).

> Logged-in roles are trusted from the cookie for a short window
> (`SESSION_MAX_AGE_SECONDS`, default 60s), after which the role is re-validated
> against the database and the cookie rewritten — so a role change takes effect
> within the window rather than persisting until logout.

### Registration & login

Anyone can self-register with an email and password; new accounts are plain,
active `USER`s. The very first registered user becomes a `SUPER_ADMIN` (a
defensive fallback — the bootstrap admin normally already exists). When a super
admin resets a password, a temporary one is generated and the account is flagged
`isTemporaryPassword`; on next login the user is forced through
`/change-password` (enforced in middleware) before accessing anything else.

## Audit log (changelog)

Every successful admin mutation (any tRPC path under `admin.*`) is recorded to
the `AuditLog` table by middleware in
[`src/server/api/trpc/middlewares.ts`](src/server/api/trpc/middlewares.ts), capturing the action, the
acting user, a sanitized snapshot of the input, and a timestamp. Admins browse
it on the **Changelog** page, filtered by date range.

## Project structure

```
src/
  app/
    (auth)/        login, register, change-password
    (dashboard)/   environments list + per-environment service view
    admin/         users, config editor, changelog (ADMIN+ only)
    _components/   shared UI (navbar, badges, toaster, refresh, ...)
  server/
    api/routers/   tRPC routers: auth, admin (users/audit/config), secrets, version
    auth.ts        iron-session config + session refresh
    bootstrap.ts   first-run admin, example users, initial config
    secrets/       per-user secret encryption (AES-256-GCM)
    audit.ts       audit-log recording
    db.ts          Prisma client
  lib/
    roles.ts       role hierarchy (source of truth)
    secrets.ts     supported per-user secrets (source of truth)
    config/        AppConfig schema, resolve (merge + placeholders), diff
    version.ts     semver comparison for the version badge
    validation/    zod schemas
  middleware.ts    route-level auth & role gating
config/
  default-config.json   seed configuration (bootstrapped as version 1)
prisma/
  schema.prisma    User, UserSecret, AuditLog, ConfigVersion models
```

## Scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start the dev server (Turbopack)             |
| `npm run build`       | Production build                             |
| `npm run start`       | Serve the production build                   |
| `npm run preview`     | Build, then start                            |
| `npm run check`       | Lint + typecheck                             |
| `npm run lint`        | ESLint (`lint:fix` to autofix)               |
| `npm run typecheck`   | `tsc --noEmit`                               |
| `npm run format:write`| Prettier write (`format:check` to verify)    |
| `npm run test`        | Run Vitest once (`test:watch` for watch mode)|
| `npm run db:push`     | Push schema (collections + indexes) to MongoDB |
| `npm run db:studio`   | Open Prisma Studio                           |

> Prisma's MongoDB connector has no migration engine, so `prisma migrate`
> does not apply — schema/index changes are synced with `npm run db:push`.

## Testing

The Vitest suite runs against its **own** MongoDB (database `dashboard_test`),
kept separate from the dev database. It defaults to a replica set on the default
port **27017** — distinct from the dev Compose DB on 27018. Start one and run the
suite:

```bash
# A throwaway single-node replica set on 27017 (CI uses an equivalent)
docker run --name dashboard-test-db -p 27017:27017 -d mongo:7 --replSet rs0
docker exec dashboard-test-db mongosh --quiet --eval "rs.initiate()"

npm test
```

Override the target with `TEST_DATABASE_URL` for a different host/port.

## Notes

- MongoDB must run as a **replica set** — Prisma uses transactions internally
  even for simple writes. Run `npm run db:push` once to create the unique indexes
  (`User.email`, `UserSecret[userId,key]`, `ConfigVersion.version`) before
  relying on them.
- Sessions are stored in encrypted cookies (no server-side session store), so
  scaling out requires only a shared `SESSION_SECRET`.

## Deployment (Vercel + MongoDB Atlas)

1. Create a free **M0** cluster on [MongoDB Atlas](https://www.mongodb.com/atlas),
   add a database user, and under **Network Access** allow `0.0.0.0/0` (Vercel's
   egress IPs are dynamic).
2. In Vercel → **Settings → Environment Variables**, set `DATABASE_URL` (the Atlas
   `mongodb+srv://…/dashboard` string, db name included), `SESSION_SECRET`, and
   `SECRETS_ENCRYPTION_KEY`. `NODE_ENV` is set by Vercel automatically.
3. Create the indexes on Atlas once (and after any schema/index change):
   ```bash
   DATABASE_URL=<atlas-url> npx prisma db push
   ```
   First-run seeding (default admin, example users, initial config) happens
   automatically on server boot via `src/instrumentation.ts`.
