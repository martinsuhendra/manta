"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct } from "@/hooks/use-products-mutation";

import { Product } from "./schema";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProductDialog({ product, open, onOpenChange }: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProduct.mutateAsync(product.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  if (!product) return null;

  const hasPurchases = product._count.memberships > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{product.name}&quot;?
            {hasPurchases && (
              <>
                <br />
                <br />
                <span className="text-destructive font-medium">
                  Warning: This product has {product._count.memberships} active purchase(s). You cannot delete a product
                  with existing memberships.
                </span>
              </>
            )}
            {!hasPurchases && (
              <>
                <br />
                <br />
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="border-t" />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending || hasPurchases}
            className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
          >
            {deleteProduct.isPending ? "Deleting..." : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
