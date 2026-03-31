import { z } from "zod";

export const cloudinaryAssetSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  format: z.string().nullable(),
  bytes: z.number().int().nullable(),
  resourceType: z.string().nullable(),
  version: z.number().int().nullable(),
});

export type CloudinaryAssetPayload = z.infer<typeof cloudinaryAssetSchema>;

export function parseCloudinaryAsset(value: unknown): CloudinaryAssetPayload | null {
  const parsed = cloudinaryAssetSchema.safeParse(value);
  if (!parsed.success) return null;
  return parsed.data;
}

export function resolveAssetUrl(asset: unknown, fallbackUrl: string | null | undefined) {
  const parsedAsset = parseCloudinaryAsset(asset);
  if (parsedAsset?.secureUrl) return parsedAsset.secureUrl;
  return fallbackUrl ?? null;
}
