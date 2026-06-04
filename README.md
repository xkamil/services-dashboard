# Services Dashboard

An internal services dashboard with self-registration, an admin-gated approval
workflow, and a role-based permission system. Bootstrapped with the
[T3 Stack](https://create.t3.gg/).

## Tech stack

| Area               | Library                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | [Next.js 15](https://nextjs.org) (App Router, React 19, Turbopack dev)  |
| UI                 | [Chakra UI v3](https://chakra-ui.com) + [next-themes](https://github.com/pacocoursey/next-themes) for light/dark |
| API layer          | [tRPC v11](https://trpc.io) with [React Query](https://tanstack.com/query) and [superjson](https://github.com/blitz-js/superjson) |
| Database / ORM     | [Prisma 6](https://prisma.io) on SQLite                                  |
| Auth & sessions    | [iron-session](https://github.com/vvo/iron-session) (encrypted cookies) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing |
| Forms & validation | [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) (via `@hookform/resolvers`) |
| Env validation     | [@t3-oss/env-nextjs](https://env.t3.gg)                                 |
| Tooling            | TypeScript, ESLint, Prettier, [Vitest](https://vitest.dev)              |

> **Styling convention:** UI is built with Chakra UI. If a use case has no
> Chakra component, a custom component is introduced explicitly rather than
> reaching for raw CSS or another library.

## Getting started

### Prerequisites

- Node.js 20+
- npm 11+

### Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Create your local env file
cp .env.example .env
```

Set the following variables in `.env`:

| Variable         | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `DATABASE_URL`   | SQLite connection string, e.g. `file:./db.sqlite`            |
| `SESSION_SECRET` | Secret used to encrypt session cookies — **min. 32 chars**   |

> Note: `.env.example` still carries the default create-t3-app placeholders
> (`AUTH_SECRET`, Discord vars). Those are unused — the variables the app
> actually validates live in `src/env.js`.

```bash
# 3. Apply the schema to a fresh database
npm run db:push

# 4. Start the dev server (http://localhost:3000)
npm run dev
```

### First-run admin

On a fresh database (no users yet), the app auto-creates a default
super-admin account on startup so it's usable immediately:

- **Email:** `admin`
- **Password:** `admin`

This runs from the Next.js `instrumentation` startup hook
(`src/server/bootstrap.ts`) and is idempotent — it does nothing once any user
exists. Change this password after first login.

## How roles & permissions work

There are four roles, defined as a single source of truth in
[`src/lib/roles.ts`](src/lib/roles.ts). They form a strict hierarchy ordered by
rank — a higher rank implies every privilege of the ranks below it.

| Role            | Rank | Label         | Badge color |
| --------------- | ---- | ------------- | ----------- |
| `NON_TECHNICAL` | 0    | Non-technical | green       |
| `DEV`           | 1    | Developer     | purple      |
| `ADMIN`         | 2    | Admin         | orange      |
| `SUPER_ADMIN`   | 3    | Super admin   | red         |

Permission checks are hierarchical via `hasMinRole(role, min)` — "does this
user meet or exceed the required role?" This is enforced in three places:

1. **Edge middleware** ([`src/middleware.ts`](src/middleware.ts)) — gates page
   routes. `/admin/*` requires `ADMIN` or higher; unauthenticated users are
   redirected to `/login`.
2. **tRPC procedures** ([`src/server/api/trpc.ts`](src/server/api/trpc.ts)) —
   `protectedProcedure` requires a session; `adminProcedure` requires `ADMIN`;
   `superAdminProcedure` requires `SUPER_ADMIN`.
3. **UI** — components use `ROLE_META` / `hasMinRole` to show or hide controls.

### What each role can do

- **Admin** — view the user list and the changelog (audit log).
- **Super admin** — everything admins can do, **plus** managing other users:
  change roles, change account status, reset passwords, and delete users.
  (You cannot delete your own account.)
- **Developer / Non-technical** — standard dashboard access; no admin area.

## Account lifecycle (status)

Each user has a `status` independent of their role. A role only takes effect
once the account is `ACTIVE`.

| Status                  | Meaning                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `PENDING_VERIFICATION`  | Self-registered, awaiting super-admin approval. Cannot log in. |
| `ACTIVE`                | Approved — can log in and use the app.                       |
| `BLOCKED`               | Disabled by an admin. Cannot log in.                         |

Flow:

1. **Registration** — anyone can self-register with an email, password, and a
   requested role. New accounts start as `PENDING_VERIFICATION`; the requested
   role has no effect until activation. The very first registered user becomes
   an `ACTIVE` `SUPER_ADMIN` (a defensive fallback — the bootstrap admin
   normally already exists).
2. **Activation** — a super admin sets the account to `ACTIVE` (and adjusts the
   role if needed) from the Users admin page.
3. **Login** — blocked and pending accounts are rejected with a clear message.

### Temporary passwords

When a super admin resets a user's password, a temporary password is generated
and the account is flagged `isTemporaryPassword`. On next login the user is
forced through `/change-password` before they can access anything else
(enforced in middleware).

## Audit log (changelog)

Every successful admin mutation (any tRPC path under `admin.*`) is recorded to
an `AuditLog` table by middleware in
[`src/server/api/trpc.ts`](src/server/api/trpc.ts). Each entry captures the
action, the acting user, a sanitized snapshot of the input, and a timestamp.
Admins can browse it on the **Changelog** admin page, filtered by date range.

## Project structure

```
src/
  app/
    (auth)/        login, register, change-password
    (dashboard)/   main authenticated dashboard
    admin/         users management + changelog (ADMIN+ only)
    _components/   shared UI (navbar, badges, toaster, ...)
  server/
    api/           tRPC routers (auth, admin) and procedure helpers
    auth.ts        iron-session config
    bootstrap.ts   first-run admin creation
    audit.ts       audit-log recording
    db.ts          Prisma client
  lib/
    roles.ts       role hierarchy (source of truth)
    validation/    zod schemas
  middleware.ts    route-level auth & role gating
prisma/
  schema.prisma    User + AuditLog models
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
| `npm run db:push`     | Push schema to the database (no migration)   |
| `npm run db:generate` | Create & apply a dev migration               |
| `npm run db:migrate`  | Apply migrations (deploy)                    |
| `npm run db:studio`   | Open Prisma Studio                           |

## Notes

- The database is **SQLite** (`prisma/db.sqlite`) — convenient for local/internal
  use. Swap the Prisma datasource for Postgres/MySQL if you need a server DB.
- Sessions are stored in encrypted cookies (no server-side session store), so
  scaling out requires only a shared `SESSION_SECRET`.
