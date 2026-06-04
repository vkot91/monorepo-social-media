-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('IMAGE');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_media_asset_id" UUID;
ALTER TABLE "users" ADD COLUMN "background_media_asset_id" UUID;

-- CreateTable
CREATE TABLE "post_images" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- Legacy post image URLs become attached media assets so old posts keep rendering.
-- The mime_type = 'image/jpeg' and size_bytes = 0 values are migration placeholders
-- for old attached URLs and must not be used as evidence that the remote legacy file
-- is actually JPEG or zero bytes.
INSERT INTO "media_assets" ("id", "owner_id", "kind", "storage_provider", "storage_key", "url", "mime_type", "size_bytes", "created_at", "updated_at")
SELECT gen_random_uuid(), "author_id", 'IMAGE', 'legacy', concat('legacy:', "id"), "image_url", 'image/jpeg', 0, "created_at", "updated_at"
FROM "posts"
WHERE "image_url" IS NOT NULL;

INSERT INTO "post_images" ("id", "post_id", "media_asset_id", "position", "created_at")
SELECT gen_random_uuid(), p."id", ia."id", 0, p."created_at"
FROM "posts" p
JOIN "media_assets" ia ON ia."storage_key" = concat('legacy:', p."id")
WHERE p."image_url" IS NOT NULL;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "image_url";

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_media_asset_id_key" ON "users"("avatar_media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_background_media_asset_id_key" ON "users"("background_media_asset_id");

-- CreateIndex
CREATE INDEX "media_assets_owner_id_idx" ON "media_assets"("owner_id");

-- CreateIndex
CREATE INDEX "media_assets_kind_idx" ON "media_assets"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "post_images_media_asset_id_key" ON "post_images"("media_asset_id");

-- CreateIndex
CREATE INDEX "post_images_post_id_position_idx" ON "post_images"("post_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_id_position_key" ON "post_images"("post_id", "position");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_media_asset_id_fkey" FOREIGN KEY ("avatar_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_background_media_asset_id_fkey" FOREIGN KEY ("background_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
