# Repository Instructions

## General

- NEVER run `git commit` or `git push` until the user explicitly asks. This overrides any plan,
  skill, or workflow step that says to commit. Prepare and stage work, then wait for the go-ahead.
- Run `git status --short` before editing. Do not revert or overwrite unrelated in-progress work.
- Prefer existing patterns over new abstractions. Read surrounding code before adding anything.
- Keep changes scoped to the task. Do not bundle unrelated refactors into feature work.
- Keep code DRY. Look for an existing helper, component, token, or variant before adding a copy.
- Use `rg` and `rg --files` for code search.

## Monorepo Structure

- `apps/web` — Next.js frontend (React, Tailwind CSS v4, TanStack Query)
- `apps/api` — NestJS backend
- `packages/contracts` — shared DTO types used by both apps
- `packages/database` — Prisma schema and migrations
- `packages/env` — validated env schemas

## Web App (`apps/web`)

### Architecture

Feature-first layout. Full details in `apps/web/ARCHITECTURE.md`.

```
app/              Next.js routes, layouts, route-level composition
features/         Product domains (auth, posts, …)
  <feature>/
    api/          query options, mutations, API helpers, cache helpers
    components/   feature UI
    hooks/        feature hooks
    store/        feature client state
    types/        feature types
shared/
  ui/             primitives: Button, Card, Input, DropdownMenu, Toast, Modal, …
  layout/         app shell, navigation, layout components
  hooks/          reusable hooks
  lib/            API clients, query utilities, theme helpers
  providers/      app-level providers
```

Import direction: `app` → `features` → `shared`. Features must not import from other features.
Promote to `shared/ui` only when two or more features need the same abstraction.

### Before Building UI

- Check `shared/ui` and `shared/layout` for existing primitives before creating new components.
- Check `cva` variants before adding one-off class strings. Extend an existing variant when the style is reusable.
- Check feature components under `features/<domain>/components` for local patterns.

### Styling

- Use semantic Tailwind tokens from `app/globals.css`: `bg-background`, `bg-surface`, `text-text`, `text-muted-text`, `border-line`, `bg-primary`, `text-on-primary`, `text-danger`, `bg-skeleton`.
- Do not hardcode hex values in components. When adding a new color, define it in `globals.css` for both light and dark themes and expose it through `@theme`.
- Preserve the theme model: server-rendered `data-theme` controls explicit light/dark; absent `data-theme` means system preference. Avoid client-only theme restoration that causes a light-first flash.
- Avoid inline `style` props for UI styling. Use Tailwind utilities, theme tokens, `cva` variants, or `globals.css` classes. Inline styles are only acceptable for runtime values that cannot be represented any other way.

### Component Conventions

- Use arrow functions throughout `apps/web`. No regular function declarations.
- Keep components small and focused.
- Use `lucide-react` for icons when one exists.
- Keep accessible names, roles, labels, and focus states explicit on interactive controls.

## API App (`apps/api`)

- NestJS modules live in `src/modules/<domain>`.
- Use existing decorators, guards, and interceptors before adding new ones.
- Validate all request payloads with class-validator DTOs.

## TypeScript

`noUncheckedIndexedAccess` is on globally. Array indexing returns `T | undefined`.

- Use optional chaining (`arr[i]?.prop`) when the element may be absent.
- Use non-null assertion (`arr[i]!`) only when the element is guaranteed by construction (e.g., inside a test that built the array).

## Delivery Checklist

Run these before marking any web feature complete:

```sh
pnpm --filter @social/web typecheck
pnpm --filter @social/web lint
pnpm --filter @social/web test
```

Run these before marking any API feature complete:

```sh
pnpm --filter @social/api typecheck
pnpm --filter @social/api lint
pnpm --filter @social/api test
```

To verify everything across the whole monorepo:

```sh
pnpm check
```

All commands must exit with code 0. Fix every error and warning (`--max-warnings=0` is enforced on lint) before considering the task done.
