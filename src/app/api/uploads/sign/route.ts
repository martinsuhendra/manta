import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/api-utils";
import { buildSignedUploadParams } from "@/lib/cloudinary";
import {
  CLOUDINARY_UPLOAD_CONSTRAINTS,
  CLOUDINARY_UPLOAD_TARGETS,
  isCloudinaryUploadTarget,
} from "@/lib/cloudinary-validation";

const signUploadSchema = z.object({
  target: z.string(),
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().int().positive("File size must be a positive integer"),
});

function toSafeBaseName(fileName: string) {
  const baseName = fileName.split(".").slice(0, -1).join(".") || fileName;
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function getTargetFolder(target: string) {
  if (target === CLOUDINARY_UPLOAD_TARGETS.BRAND_LOGO) return "manta/brands/logos";
  if (target === CLOUDINARY_UPLOAD_TARGETS.PRODUCT_IMAGE) return "manta/products/images";
  return "manta/users/avatars";
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = signUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid upload signature request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { target, fileName, contentType, size } = parsed.data;

    if (!isCloudinaryUploadTarget(target)) {
      return NextResponse.json({ error: "Unsupported upload target" }, { status: 400 });
    }

    const constraint = CLOUDINARY_UPLOAD_CONSTRAINTS[target];
    if (!constraint.allowedMimeTypes.includes(contentType)) {
      return NextResponse.json({ error: "Unsupported file type for this upload target" }, { status: 400 });
    }

    if (size > constraint.maxBytes) {
      return NextResponse.json({ error: "File exceeds max size limit for this upload target" }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = getTargetFolder(target);
    const safeBaseName = toSafeBaseName(fileName);
    const publicId = `${folder}/${user?.role?.toLowerCase() ?? "user"}-${safeBaseName}-${randomUUID()}`;
    const { signature } = buildSignedUploadParams({
      timestamp,
      folder,
      publicId,
    });

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature,
    });
  } catch (error) {
    console.error("Failed to sign Cloudinary upload params:", error);
    return NextResponse.json({ error: "Failed to sign upload request" }, { status: 500 });
  }
}
