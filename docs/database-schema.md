# Database Schema Draft

Primary database: PostgreSQL.

Workspace package: `packages/database`

Schema source: `packages/database/prisma/schema.prisma`

## Core entities

### users

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `email` | `text` | Unique login identifier; case-insensitive handling belongs in service validation or a later database extension |
| `username` | `varchar(32)` | Unique public handle |
| `password_hash` | `text` | `bcrypt` hash |
| `display_name` | `varchar(80)` | User-facing name |
| `bio` | `text` | Nullable |
| `avatar_url` | `text` | Nullable |
| `created_at` | `timestamptz` | Default now |
| `updated_at` | `timestamptz` | Default now |

### refresh_tokens

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK -> `users.id` |
| `token_hash` | `text` | Hashed refresh token |
| `expires_at` | `timestamptz` | Rotation boundary |
| `revoked_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default now |

### posts

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `author_id` | `uuid` | FK -> `users.id` |
| `content` | `text` | Post body |
| `image_url` | `text` | Nullable, phase 2 |
| `visibility` | `varchar(16)` | `public`, `friends` |
| `created_at` | `timestamptz` | Default now |
| `updated_at` | `timestamptz` | Default now |

### comments

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `post_id` | `uuid` | FK -> `posts.id` |
| `author_id` | `uuid` | FK -> `users.id` |
| `content` | `text` | Comment body |
| `created_at` | `timestamptz` | Default now |
| `updated_at` | `timestamptz` | Default now |

### post_likes

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` | FK -> `users.id` |
| `post_id` | `uuid` | FK -> `posts.id` |
| `created_at` | `timestamptz` | Default now |

Composite primary key: `user_id + post_id`

### friendships

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `requester_id` | `uuid` | FK -> `users.id` |
| `addressee_id` | `uuid` | FK -> `users.id` |
| `status` | `varchar(16)` | `pending`, `accepted`, `rejected` |
| `created_at` | `timestamptz` | Default now |
| `updated_at` | `timestamptz` | Default now |

Unique index: `requester_id + addressee_id`

Manual unique index: unordered pair using `LEAST(requester_id, addressee_id)` and `GREATEST(requester_id, addressee_id)` to prevent duplicate reverse friendship rows.

### user_blocks

| Column | Type | Notes |
| --- | --- | --- |
| `blocker_id` | `uuid` | FK -> `users.id`; user who created the block |
| `blocked_id` | `uuid` | FK -> `users.id`; user who is blocked |
| `created_at` | `timestamptz` | Default now |

Composite primary key: `blocker_id + blocked_id`

Blocking is directional and independent from friendship status.

## Query notes

- Feed query joins `posts` with accepted friendships when visibility is `friends`
- Like counts and comment counts should be aggregated in query projections, not stored denormalized initially
- Refresh tokens should be pruned by expiration and revocation status

## Prisma model order

1. `User`
2. `RefreshToken`
3. `Post`
4. `Comment`
5. `PostLike`
6. `Friendship`
7. `UserBlock`

## Current package scripts

- `pnpm --filter @social/database db:generate`
- `pnpm --filter @social/database db:migrate`
- `pnpm --filter @social/database db:studio`

## Env validation

The database package validates `DATABASE_URL` through `@social/env`. API runtime validation also requires JWT secrets and CORS settings because the backend cannot start safely without them.

Prisma CLI reads `packages/database/.env` when running database package scripts. Keep it aligned with the root `.env` `DATABASE_URL`.

For local Docker databases, run `pnpm --filter @social/database db:grant` once after `docker compose up -d`. This creates the dedicated `social_media` database role and grants ownership of the local `social_media` database/schema.
