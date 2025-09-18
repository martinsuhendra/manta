"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a FileReader to convert the file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange("");
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
        disabled={disabled}
      />

      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={value}
            alt="Product image"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
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
            "flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border border-dashed bg-muted/40 hover:bg-muted/60 transition-colors",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
              <p className="text-xs text-muted-foreground">Landscape orientation recommended</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}