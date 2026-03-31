"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CloudinaryAssetPayload } from "@/lib/cloudinary-asset";
import {
  CLOUDINARY_UPLOAD_CONSTRAINTS,
  CLOUDINARY_UPLOAD_TARGETS,
  CloudinaryUploadTarget,
} from "@/lib/cloudinary-validation";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (value?: string) => void;
  onAssetChange?: (asset?: CloudinaryAssetPayload | null) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  uploadTarget?: CloudinaryUploadTarget;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "video" | "square";
}

interface SignUploadResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
  version?: number;
}

export function ImageUpload({
  value,
  onChange,
  onAssetChange,
  onUploadStateChange,
  uploadTarget = CLOUDINARY_UPLOAD_TARGETS.PRODUCT_IMAGE,
  disabled,
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const setUploadingState = React.useCallback(
    (nextState: boolean) => {
      setIsUploading(nextState);
      onUploadStateChange?.(nextState);
    },
    [onUploadStateChange],
  );

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const constraint = CLOUDINARY_UPLOAD_CONSTRAINTS[uploadTarget];
    if (!constraint.allowedMimeTypes.includes(file.type)) {
      toast.error("Unsupported file type");
      return;
    }

    if (file.size > constraint.maxBytes) {
      toast.error(`File too large. Max ${(constraint.maxBytes / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    setUploadingState(true);
    setProgress(0);

    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: uploadTarget,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!signRes.ok) {
        const errorPayload = (await signRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorPayload.error ?? "Failed to sign upload request");
      }

      const signedPayload = (await signRes.json()) as SignUploadResponse;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signedPayload.apiKey);
      formData.append("timestamp", String(signedPayload.timestamp));
      formData.append("folder", signedPayload.folder);
      formData.append("public_id", signedPayload.publicId);
      formData.append("signature", signedPayload.signature);

      const uploadResponse = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${signedPayload.cloudName}/image/upload`);

        xhr.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error("Cloudinary upload failed"));
            return;
          }

          const parsed = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
          resolve(parsed);
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      const nextAsset: CloudinaryAssetPayload = {
        publicId: uploadResponse.public_id,
        secureUrl: uploadResponse.secure_url,
        width: uploadResponse.width ?? null,
        height: uploadResponse.height ?? null,
        format: uploadResponse.format ?? null,
        bytes: uploadResponse.bytes ?? null,
        resourceType: uploadResponse.resource_type ?? null,
        version: uploadResponse.version ?? null,
      };

      onChange(nextAsset.secureUrl);
      onAssetChange?.(nextAsset);
      toast.success("Image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setUploadingState(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    onAssetChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg border bg-muted",
            aspectRatio === "square" ? "aspect-square" : "aspect-video"
          )}
        >
          <Image
            src={value}
            alt="Product image"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed bg-muted/40 transition-colors hover:bg-muted/60",
            aspectRatio === "square" ? "aspect-square" : "aspect-video",
            (disabled || isUploading) && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs">PNG, JPG, WEBP, GIF</p>
              <p className="text-xs text-muted-foreground">Landscape orientation recommended</p>
            </div>
          </div>
        </div>
      )}
      {isUploading && <p className="text-muted-foreground text-xs">Uploading... {progress}%</p>}
    </div>
  );
}