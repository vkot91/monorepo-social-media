# Web Architecture

The web app uses a feature-first structure with a small shared layer.

## Folders

- `app`: Next.js routes, route handlers, layouts, loading states, and route-level composition.
- `features`: Product domains such as `auth`, `posts`, `chat`, and `notifications`.
- `shared`: Reusable primitives and cross-cutting infrastructure that are safe to import from any feature.

## Feature Folders

Feature code should stay inside its owning domain until it is reused across domains.

```txt
features/<feature>/
  api/          query options, mutations, route contracts, API helpers
  components/   feature-specific UI
  hooks/        feature-specific hooks
  store/        feature-specific client state
  types/        feature-specific types
```

Examples:

- `features/chat/components/message-composer.tsx`
- `features/notifications/components/notification-bell.tsx`
- `features/posts/api/queries.ts`

## Shared Folders

Shared code must be generic and domain-neutral.

```txt
shared/
  ui/         primitives such as Button, Card, Input, DropdownMenu, Toast, Modal
  layout/     app shell, navigation, and layout components
  hooks/      reusable hooks
  lib/        API clients, theme helpers, logging, query utilities
  providers/  app-level providers
```

Do not move a component to `shared/ui` just because it might be reused later. Start inside the feature, then promote it when at least two features need the same abstraction.

## Import Direction

- `app` may import from `features` and `shared`.
- `features` may import from `shared`.
- `shared` should not import feature UI. If shared infrastructure needs feature route types, keep the dependency narrow and type-only where possible.
- Features should avoid importing components from other features. Promote genuinely reusable UI to `shared/ui`, or expose a small public API from the owning feature.
