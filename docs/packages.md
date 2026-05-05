# Recommended Packages

## Root workspace

- `pnpm`: package manager and workspace support
- `turbo`: task orchestration and caching
- `typescript`: shared type-checking baseline
- `prettier`: repository formatting

## Shared packages

- `@social/database`: Prisma schema, Prisma client entry point, and database scripts
- `@social/env`: Zod schemas for API and web environment variables
- `@social/eslint-config`: shared ESLint presets with separate Next.js and NestJS rules
- `@social/prettier-config`: shared Prettier config

## Web app

- `next`, `react`, `react-dom`
- `@social/env`: validates public web runtime configuration
- `@tanstack/react-query`: async server state and caching
- `zod`: runtime-safe validation schemas
- `react-hook-form`: forms
- `class-variance-authority`: composable styling variants
- `tailwindcss`, `postcss`, `autoprefixer`: styling foundation
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`: test stack
- `msw`: API mocking for frontend tests

## API app

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `@social/database`: shared database client and Prisma schema
- `@social/env`: validates required API environment variables
- `@nestjs/config`: env configuration
- `@nestjs/jwt`: JWT issuing and validation
- `@nestjs/passport`: auth strategy integration
- `passport`, `passport-jwt`, `passport-local`
- `bcrypt`: password hashing
- `class-validator`, `class-transformer`: DTO validation
- `prisma`, `@prisma/client`: ORM and generated client
- `jest`, `ts-jest`, `supertest`: backend test stack
- `cookie-parser`: refresh-token transport if cookies are used

## Deferred until chat phase

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`, `socket.io-client`
- `redis` or `ioredis` for cross-instance pub/sub

## Package policy

- Add a dependency only when the first concrete feature needs it
- Use `zod` for environment validation at package boundaries
- Prefer one request validation strategy per app slice: DTO validation in NestJS controllers, Zod for shared config/env parsing
- Shared packages should appear only after repeated duplication

## Linting and formatting

- Root formatting uses `@social/prettier-config`.
- `apps/web` extends `@social/eslint-config/next`.
- `apps/api` extends `@social/eslint-config/nest`.
- Shared packages extend `@social/eslint-config/base` unless they need framework-specific rules.
