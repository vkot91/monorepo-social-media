# Architecture Overview

## Goals

- Practice `Next.js` in a realistic frontend application
- Practice `NestJS` in a modular backend application
- Keep auth, persistence, and realtime concerns evolvable
- Require tests for every feature slice before merge

## Monorepo structure

- `apps/web`: Next.js App Router frontend
- `apps/api`: NestJS REST API
- `packages/database`: Prisma schema and database client
- `packages/env`: Zod-based environment validation
- `packages/eslint-config`: shared ESLint presets
- `packages/prettier-config`: shared Prettier rules

## Initial technical choices

### Frontend

- Next.js 14 App Router
- React 18
- React Testing Library + Vitest
- TanStack Query for server state
- React Hook Form + Zod for forms and validation

### Backend

- NestJS 10
- PostgreSQL with Prisma
- JWT auth with access and refresh tokens
- Jest for unit and integration tests

### Infra

- Turborepo for task orchestration
- PNPM workspaces
- Docker Compose for local PostgreSQL and Redis later
- Zod validation for environment variables before app startup

## Backend module plan

- `auth`: register, login, refresh, logout
- `users`: profile, search, friend requests, friend list
- `posts`: CRUD, feed queries
- `comments`: CRUD for post comments
- `likes`: toggle likes on posts
- `chat`: deferred until after the social graph is stable

## Auth strategy

- Access token: short-lived JWT used on API requests
- Refresh token: long-lived token rotated on refresh
- Store only a hashed refresh token server-side
- Revoke refresh tokens on logout and suspicious activity

## Testing strategy

- Frontend: component tests for presentational logic and page states
- Backend: unit tests for services/controllers and integration tests for auth and persistence boundaries
- CI rule: new production code must include tests in the same slice

## Delivery phases

1. Monorepo scaffold, docs, and design spec
2. Auth and user model
3. Post feed with CRUD
4. Comments and likes
5. Friends graph and feed filtering
6. WebSocket chat
