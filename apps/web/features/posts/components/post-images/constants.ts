export const POST_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const POST_IMAGE_MAX_COUNT = 4;
export const POST_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_IMAGE_OPTIMIZED_REMOTE_HOSTS = ["res.cloudinary.com"] as const;

export const POST_IMAGE_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
