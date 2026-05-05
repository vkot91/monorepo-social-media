# Social Media Clone

Greenfield Turborepo workspace for a social media clone used to practice `Next.js` and `NestJS`.

## Planned product scope

- JWT auth with access and refresh tokens
- CRUD posts
- Comments and likes
- Friend relationships
- Realtime chat in a later phase with WebSockets
- Test coverage for all application code

## Workspace layout

- `apps/web`: Next.js frontend
- `apps/api`: NestJS backend
- `docs`: architecture, package, schema, and UI specs

## Next step

Install dependencies with `pnpm install`, then implement the auth slice first using the docs in `docs/`.

## Local Development Notes

Workspace packages compile to `dist` before apps consume them at runtime. After changing a package such as `@social/env`, run:

```sh
pnpm --filter @social/env build
```

The root `pnpm dev` task also runs dependency builds before starting persistent app dev tasks.
