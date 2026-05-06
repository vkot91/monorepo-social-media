-- Remove BLOCKED from FriendshipStatus. Early development data cannot preserve
-- blocker direction from old friendship rows, so old BLOCKED rows are rejected.
UPDATE "friendships"
SET "status" = 'REJECTED'
WHERE "status" = 'BLOCKED';

ALTER TABLE "friendships" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "FriendshipStatus" RENAME TO "FriendshipStatus_old";
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "friendships"
  ALTER COLUMN "status" TYPE "FriendshipStatus"
  USING "status"::text::"FriendshipStatus";
ALTER TABLE "friendships" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "FriendshipStatus_old";

-- Prevent duplicate mutual relationships represented in the reverse direction.
CREATE UNIQUE INDEX "friendships_unordered_user_pair_key"
ON "friendships" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));

-- CreateTable
CREATE TABLE "user_blocks" (
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateIndex
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
