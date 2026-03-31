import { v2 as cloudinary } from "cloudinary";

interface BuildSignedUploadParamsInput {
  timestamp: number;
  folder: string;
  publicId: string;
}

interface DeleteAssetInput {
  publicId: string;
  resourceType?: "image" | "video" | "raw";
}

export interface CloudinaryAsset {
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  resourceType: string | null;
  version: number | null;
}

let isConfigured = false;

function ensureCloudinaryConfig() {
  if (isConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

export function buildSignedUploadParams(input: BuildSignedUploadParamsInput) {
  ensureCloudinaryConfig();

  const paramsToSign = {
    timestamp: input.timestamp,
    folder: input.folder,
    public_id: input.publicId,
  };

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error("Missing CLOUDINARY_API_SECRET");

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    paramsToSign,
  };
}

export async function deleteCloudinaryAsset({ publicId, resourceType = "image" }: DeleteAssetInput) {
  ensureCloudinaryConfig();

  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}

export function buildCloudinaryTransformedUrl({
  publicId,
  width,
  height,
  crop = "fill",
}: {
  publicId: string;
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit" | "pad" | "thumb";
}) {
  ensureCloudinaryConfig();

  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    width,
    height,
    crop,
  });
}
