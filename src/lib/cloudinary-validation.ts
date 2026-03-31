export const CLOUDINARY_UPLOAD_TARGETS = {
  BRAND_LOGO: "brand-logo",
  PRODUCT_IMAGE: "product-image",
  USER_AVATAR: "user-avatar",
} as const;

export type CloudinaryUploadTarget = (typeof CLOUDINARY_UPLOAD_TARGETS)[keyof typeof CLOUDINARY_UPLOAD_TARGETS];

export interface UploadConstraint {
  maxBytes: number;
  allowedMimeTypes: string[];
}

const MB = 1024 * 1024;

export const CLOUDINARY_UPLOAD_CONSTRAINTS: Record<CloudinaryUploadTarget, UploadConstraint> = {
  [CLOUDINARY_UPLOAD_TARGETS.BRAND_LOGO]: {
    maxBytes: 5 * MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
  [CLOUDINARY_UPLOAD_TARGETS.PRODUCT_IMAGE]: {
    maxBytes: 10 * MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  [CLOUDINARY_UPLOAD_TARGETS.USER_AVATAR]: {
    maxBytes: 5 * MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};

export function isCloudinaryUploadTarget(value: string): value is CloudinaryUploadTarget {
  return Object.values(CLOUDINARY_UPLOAD_TARGETS).includes(value as CloudinaryUploadTarget);
}
