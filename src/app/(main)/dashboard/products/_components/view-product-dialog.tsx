"use client";

import * as React from "react";

import Image from "next/image";

import { format } from "date-fns";
import { Calendar, Clock, Banknote, Package, Users, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Product } from "./schema";

interface ViewProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProductImage({ product }: { product: Product }) {
  if (!product.image) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Product Image</span>
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </div>
    </div>
  );
}

function ProductDescription({ product }: { product: Product }) {
  if (!product.description) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Description</span>
      <p className="text-muted-foreground text-sm">{product.description}</p>
    </div>
  );
}

function ProductStats({ product }: { product: Product }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Banknote className="h-4 w-4" />
            Price
          </div>
          <p className="text-lg font-semibold">Rp {Number(product.price || 0).toLocaleString("id-ID")}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Valid Days
          </div>
          <p className="text-lg font-semibold">{product.validDays} days</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Usage Quota
          </div>
          <p className="text-lg font-semibold">{product.quota}</p>
        </div>
      </div>
    </>
  );
}

function ProductIncludes({ product }: { product: Product }) {
  if (!product.whatIsIncluded) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">What&apos;s Included?</span>
      <div
        className="text-muted-foreground prose prose-sm max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: product.whatIsIncluded }}
      />
    </div>
  );
}

function ProductFeatures({ product }: { product: Product }) {
  if (!product.features || product.features.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Features</span>
      <div className="flex flex-wrap gap-1">
        {product.features.map((feature, index) => (
          <Badge key={index} variant="outline">
            {feature}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ProductPayment({ product }: { product: Product }) {
  if (!product.paymentUrl) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Payment URL</span>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => window.open(product.paymentUrl!, "_blank")}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open Payment Link
      </Button>
    </div>
  );
}

function ProductTimestamps({ product }: { product: Product }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Created</span>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(product.createdAt), "MMM dd, yyyy")}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Last Updated</span>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(product.updatedAt), "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
}

export function ViewProductDialog({ product, open, onOpenChange }: ViewProductDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product.name}
          </DialogTitle>
          <DialogDescription>Product details and statistics</DialogDescription>
        </DialogHeader>
        <div className="border-t" />

        <div className="space-y-6">
          <ProductImage product={product} />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <ProductDescription product={product} />
          <ProductStats product={product} />
          <ProductIncludes product={product} />
          <ProductFeatures product={product} />
          <ProductPayment product={product} />
          <ProductTimestamps product={product} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
