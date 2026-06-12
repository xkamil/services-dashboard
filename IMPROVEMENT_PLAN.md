# Services Dashboard — Review Summary & Improvement Plan

Reviewed: project structure, component size/duplication, Chakra UI usage & UX consistency, server-side practices, tests, tooling. Date: 2026-06-12.

## What is already good (do not touch)

- Clear structure: `(auth)` / `(dashboard)` / `admin` route groups with `_components` colocated next to pages; pure logic in `src/lib`, effects in `src/server`.
- Chakra usage is disciplined: semantic tokens (`fg.muted`, `bg.muted`, `border`, `red.fg`) instead of hardcoded colors, one central sizing override in `src/app/provider.tsx`, shared `AppDialog` shell, shared `Toaster`, `RefreshButton`, `SearchInput`, `RoleBadge`.
- Security fundamentals: bcrypt cost 12, AES-256-GCM secrets never returned to client, audit-log input sanitization, role hierarchy enforced in middleware + tRPC procedures + UI, session role re-validation window.
- Strong test suite (auth, admin, config, secrets, session refresh, config resolve, version compare) with isolated test DB.
- Strict TypeScript (`noUncheckedIndexedAccess`), strict ESLint, env validation via `@t3-oss/env-nextjs`.

## What should be done better (summary)

1. **Dead Tailwind stack** — `tailwindcss`, `@tailwindcss/postcss`, `prettier-plugin-tailwindcss` are installed and wired into `postcss.config.js`, `prettier.config.js`, and `src/styles/globals.css`, but zero Tailwind classes exist; all UI is Chakra. Pure maintenance noise.
2. **Repeated table boilerplate** — `users-table.tsx` (272 lines) and `audit-log-table.tsx` (260 lines) each reimplement: sortable column headers + sort state, skeleton loading rows, empty-state row, bordered `Table.Root` wrapper, toolbar (search + refresh). `config-history.tsx` repeats parts of it.
3. **Repeated dialog boilerplate** — the mutation pattern `onSuccess: invalidate + close + success toast / onError: error toast` is copy-pasted across ~6 dialogs; the footer (`Cancel` ghost + colored `Confirm` with `loading`) is repeated in every dialog.
4. **Repeated skeleton loading blocks** — `{[0..3].map(i => <Skeleton h="10" />)}` appears 6× across the app.
5. **Oversized components** — `users-table.tsx`, `audit-log-table.tsx`, `secrets-dialog.tsx` (232), `environment-panel.tsx` (204) mix data fetching, filtering/sorting logic, and large JSX in one file.
6. **Auth security gaps** — no rate limiting on public `login`/`register` procedures; `register` returns `EMAIL_TAKEN`, enabling email enumeration.
7. **Missing error/404 surfaces** — no `error.tsx`, `global-error.tsx`, or `not-found.tsx` in `src/app`; an unhandled render error shows the raw Next.js screen.
8. **Minor server cleanups** — `admin.ts` holds three routers in one file; `lib/config/schema.ts` mixes schema with a 40-line cross-reference validation block; repeated inline `TRPCError` construction; `version.getForService` stub has no test.
9. **Tooling nits** — `package.json` name typo (`services-dasboard`); `db:generate` runs `prisma migrate dev`, which does not apply to the MongoDB connector (README already says so).

UX verdict: the UI is consistent and close to stock Chakra — no "customization nightmare" found. The plan deliberately avoids restyling; items below only consolidate existing patterns.

---

## Implementation plan

### Phase 1 — Quick wins (tooling & hygiene)

- [x] **Remove the Tailwind stack**
  - Uninstall `tailwindcss`, `@tailwindcss/postcss`, `prettier-plugin-tailwindcss`.
  - Delete `postcss.config.js` Tailwind plugin entry (drop the file if empty) and the plugin from `prettier.config.js`.
  - Replace `src/styles/globals.css`: drop `@import "tailwindcss"` and the `@theme` block; move the Geist font into the Chakra system config in `src/app/provider.tsx` (`theme.tokens.fonts.body/heading` → `var(--font-geist-sans)`).
  - Verify: `npm run build`, visual check that the font is unchanged in light/dark mode.
- [x] **Fix `package.json`**: rename `services-dasboard` → `services-dashboard`; remove or repoint the `db:generate` / `db:migrate` scripts (MongoDB connector has no migrate engine — keep `db:push` only).
- [x] **Add error surfaces**: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx` using Chakra (`EmptyState` or simple `Stack` + `Button` retry/home), consistent with existing empty states.

### Phase 2 — Frontend deduplication (shared components in `src/app/_components`)

- [x] **`skeleton-rows.tsx`** (+ `environment-skeleton.tsx` for the header+grid variant the two environment pages duplicated) — `<SkeletonRows count={4} h="10" />`; replace the 6 inline skeleton-map blocks (`users-table.tsx:141-146`, `audit-log-table.tsx:167`, `config-history.tsx:103`, `environments-index.tsx:32-36`, `environment-detail.tsx:17-21`, `config-diff-dialog.tsx:61`).
- [x] **`use-table-sort.ts` + `sortable-header.tsx`** — extract the sort state (`sortField`/`sortDir`/`toggleSort`), comparator, `SortIcon`, and `sortableHeader` render helper from `users-table.tsx`. (Correction: `audit-log-table.tsx` has no sorting, so this applies to the users table only; the hook is ready for reuse.)
- [x] **`data-table.tsx`** — shared shell: bordered/rounded `Box` + `Table.Root variant="line"` + empty-state row with `colSpan` + `fg.muted` message. Tables pass headers, rows, and `emptyMessage`.
- [x] **Extend `dialog-utils.tsx` with `DialogActions`** — `<DialogActions onCancel confirmLabel confirmPalette loading disabled onConfirm />` replacing the Cancel/Confirm footer pair in `change-role-dialog.tsx`, `delete-user-dialog.tsx`, `reset-password-dialog.tsx`, and config-history's `RevertDialog`. (Correction: `secrets-dialog.tsx` and `config-diff-dialog.tsx` have single Close-button footers, not this pattern.)
- [x] **`use-toast-mutation.ts`** — implemented as `toastMutationOptions()` in `src/lib/toast.ts` (an options-builder composes better with tRPC's typed `useMutation` than a wrapper hook); adopted by all 7 mutations that repeated the pattern (change-role, delete-user, reset-password, revert, config save, secret set/remove).
- [x] **Set `role="alertdialog"`** on the destructive `DeleteUserDialog` — already present at review time (`delete-user-dialog.tsx`); no change needed.

### Phase 3 — Split oversized components (no behavior change)

- [x] **`users-table.tsx` (272 → 152 lines)**: extract `user-actions-menu.tsx` (the `Menu.Root` block, lines 197-249) and move sorting to the Phase-2 hook; keep dialogs' state in the table.
- [ ] **`audit-log-table.tsx` (260)**: extract row-detail rendering and filter toolbar into siblings; adopt shared table pieces.
- [ ] **`secrets-dialog.tsx` (232)**: extract per-secret row/form into `secret-field.tsx`.
- [ ] **`environment-panel.tsx` (204)**: extract the filter toolbar (search + owner + version-status + view options) into `environment-toolbar.tsx`.
- [ ] **`config-history.tsx` (189)**: reuse shared table shell + `SkeletonRows`; extract revert-confirmation wiring if still large.

### Phase 4 — Server hardening & cleanup

- [ ] **Rate-limit public auth procedures** (high priority): add a small in-memory sliding-window limiter (per IP + per email) as tRPC middleware on `auth.login` / `auth.register` in `src/server/api/routers/auth.ts`; return `TOO_MANY_REQUESTS`. Document the single-instance limitation (cookie sessions already assume shared-nothing scaling; note Redis as the scale-out path).
- [ ] **Stop email enumeration**: make `register` return a generic failure instead of `EMAIL_TAKEN` (`auth.ts:22-24`); update `register/page.tsx` error mapping and `tests/auth.test.ts`.
- [ ] **Split `admin.ts` router** into `src/server/api/routers/admin/{index,users,audit}.ts` (config router already separate).
- [ ] **Split `lib/config/schema.ts`**: keep pure Zod shapes in `schema.ts`, move the `superRefine` cross-reference/duplicate checks to `lib/config/validate.ts`; re-export so callers don't change.
- [ ] **Error helpers** (optional, low value): `src/server/api/errors.ts` with `notFound()`, `conflict()` etc. to replace repeated inline `TRPCError` construction.

### Phase 5 — Tests for the changes

- [ ] Add `tests/version-router.test.ts` covering `version.getForService` (currently untested).
- [ ] Add explicit permission-boundary tests: USER calling `admin.*` → FORBIDDEN; ADMIN calling `superAdmin` procedures → FORBIDDEN.
- [ ] Add rate-limiter tests (login lockout window, reset after window).
- [ ] Run full verification: `npm run check && npm test && npm run build`, then manual smoke test of users table, changelog, config editor, secrets dialog in light + dark mode.

### Suggested order & effort

| Phase | Effort | Risk | Why this order |
|-------|--------|------|----------------|
| 1 Tooling | ~1 h | Low | Removes noise before refactors touch configs |
| 2 Dedup | ~3-4 h | Low | Shared pieces must exist before Phase 3 uses them |
| 3 Splits | ~3 h | Low | Pure moves, behavior unchanged |
| 4 Server | ~3 h | Medium | Security items first (`rate limit`, enumeration) |
| 5 Tests | ~2 h | Low | Locks in Phases 2-4 |
