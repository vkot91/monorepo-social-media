# Repository Instructions

## General

- Preserve user changes. Check `git status --short` before editing and do not revert unrelated work.
- Prefer the existing project patterns over introducing new abstractions.
- Keep changes DRY. If behavior or styling repeats, look for an existing helper, component, token, or variant before adding another copy.
- Keep edits scoped to the requested task. Do not mix unrelated refactors into feature work.
- Use `rg` and `rg --files` for code search.

## Web App

The frontend lives in `apps/web` and uses Next.js, React, Tailwind CSS v4, and shared UI primitives.

Before building or changing UI:

- Check existing components in `apps/web/components/ui` and `apps/web/components/layout`.
- Reuse existing primitives such as `Button`, `Card`, form controls, layout shells, navigation links, and app logo before creating new components.
- Check component variants before adding one-off class strings. Prefer extending an existing `cva` variant when the style is reusable.
- Check existing feature components under `apps/web/features` for local patterns before introducing a new pattern.

Styling rules:

- Use semantic Tailwind color classes backed by `apps/web/app/globals.css`, such as `bg-background`, `bg-surface`, `text-text`, `text-muted-text`, `border-line`, `bg-primary`, `text-on-primary`, `text-danger`, and `bg-skeleton`.
- Do not hardcode hex colors in components unless adding or changing tokens in `globals.css` is part of the task.
- When adding a new color, define it in `globals.css` for both light and dark themes, then expose it through `@theme`.
- Preserve the theme model: server-rendered `data-theme` controls explicit light/dark mode, and no `data-theme` means system preference.
- Avoid client-only theme restoration that can cause a light-first paint.

Component design:

- Keep UI components small and focused.
- Use arrow functions throughout `apps/web`; do not add regular function declarations there.
- Use `lucide-react` icons when an icon is needed and one already exists.
- Keep accessible names, roles, labels, and focus states explicit for interactive controls.
- Avoid duplicating layout or form markup. Extract a small component only when it removes real duplication or matches an existing pattern.

Verification:

- For web changes, run the narrowest relevant tests first.
- Cover components and functions with unit tests.
- Add end-to-end tests for breaking or high-risk features.
- Before handing off completed web work, run:

```sh
pnpm --filter @social/web test
pnpm --filter @social/web typecheck
pnpm --filter @social/web lint
```
